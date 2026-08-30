import os
import io
import re
import urllib.parse
from typing import Union, Dict, Any, Optional

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    pypdf = None
    PYPDF_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    requests = None
    REQUESTS_AVAILABLE = False


def normalize_extracted_text(raw_text: str) -> str:
    """
    Clean and normalize extracted text:
    - Normalizes unicode spaces and special line breaks
    - Removes non-printable control characters (except newline, tab)
    - Collapses excessive consecutive spaces and blank lines
    """
    if not raw_text:
        return ""

    # Replace non-breaking spaces and line separators
    text = raw_text.replace('\u00a0', ' ').replace('\u200b', '')
    text = re.sub(r'[\r\f\v]', '\n', text)
    
    # Remove control characters except tab and newline
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

    # Collapse multiple horizontal spaces/tabs to a single space
    text = re.sub(r'[ \t]+', ' ', text)

    # Collapse 3 or more newlines into double newlines (paragraphs)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Clean leading/trailing spaces on each line
    lines = [line.strip() for line in text.split('\n')]
    cleaned = '\n'.join(lines).strip()
    return cleaned


def _extract_with_pymupdf(stream_or_path: Union[str, bytes, io.BytesIO]) -> Dict[str, Any]:
    """Extract text from PDF using PyMuPDF (fitz)"""
    doc = None
    try:
        if isinstance(stream_or_path, (bytes, bytearray)):
            doc = fitz.open(stream=stream_or_path, filetype="pdf")
        elif isinstance(stream_or_path, io.BytesIO):
            doc = fitz.open(stream=stream_or_path.getvalue(), filetype="pdf")
        elif isinstance(stream_or_path, str):
            doc = fitz.open(stream_or_path)
        else:
            # File-like object
            data = stream_or_path.read()
            if hasattr(stream_or_path, 'seek'):
                stream_or_path.seek(0)
            doc = fitz.open(stream=data, filetype="pdf")

        page_count = len(doc)
        extracted_pages = []

        for page_idx in range(page_count):
            try:
                page = doc[page_idx]
                page_text = page.get_text("text") or ""
                if page_text.strip():
                    extracted_pages.append(page_text.strip())
            except Exception:
                continue

        full_text = "\n\n".join(extracted_pages)
        return {
            "success": True,
            "text": full_text,
            "page_count": page_count,
            "non_empty_pages": len(extracted_pages)
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "error": str(e)
        }
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass


def _extract_with_pypdf(stream_or_path: Union[str, bytes, io.BytesIO]) -> Dict[str, Any]:
    """Fallback text extraction using pypdf"""
    try:
        if isinstance(stream_or_path, (bytes, bytearray)):
            reader = pypdf.PdfReader(io.BytesIO(stream_or_path))
        elif isinstance(stream_or_path, io.BytesIO):
            reader = pypdf.PdfReader(stream_or_path)
        elif isinstance(stream_or_path, str):
            reader = pypdf.PdfReader(stream_or_path)
        else:
            data = stream_or_path.read()
            if hasattr(stream_or_path, 'seek'):
                stream_or_path.seek(0)
            reader = pypdf.PdfReader(io.BytesIO(data))

        page_count = len(reader.pages)
        extracted_pages = []

        for page in reader.pages:
            try:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(page_text.strip())
            except Exception:
                continue

        full_text = "\n\n".join(extracted_pages)
        return {
            "success": True,
            "text": full_text,
            "page_count": page_count,
            "non_empty_pages": len(extracted_pages)
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "error": str(e)
        }


def extract_pdf_text(source: Any) -> Dict[str, Any]:
    """
    Extract readable text from a PDF source.

    Parameters:
        source: Any of the following:
            - local file path (str or os.PathLike)
            - raw bytes or bytearray
            - Supabase Storage URL (http/https)
            - file-like object (io.BytesIO, Werkzeug FileStorage, etc.)

    Returns:
        Dict with keys:
            success (bool): True if readable text was successfully extracted
            text (str): Cleaned and normalized text content
            page_count (int): Total number of pages in the PDF
            character_count (int): Length of extracted text
            word_count (int): Word count of extracted text
            error (str, optional): User-friendly error message on failure
    """
    if source is None:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "character_count": 0,
            "word_count": 0,
            "error": "No PDF source provided."
        }

    raw_data: Union[str, bytes, io.BytesIO] = None

    # Handle string input: could be a URL or local file path
    if isinstance(source, str):
        source_str = source.strip()
        if not source_str:
            return {
                "success": False,
                "text": "",
                "page_count": 0,
                "character_count": 0,
                "word_count": 0,
                "error": "PDF file path is empty."
            }

        # Check if source is an HTTP/HTTPS URL (e.g. Supabase Storage public/signed URL)
        if source_str.startswith(('http://', 'https://')):
            if not REQUESTS_AVAILABLE:
                return {
                    "success": False,
                    "text": "",
                    "page_count": 0,
                    "character_count": 0,
                    "word_count": 0,
                    "error": "HTTP client library unavailable for remote PDF download."
                }
            try:
                response = requests.get(source_str, timeout=15)
                if response.status_code != 200:
                    return {
                        "success": False,
                        "text": "",
                        "page_count": 0,
                        "character_count": 0,
                        "word_count": 0,
                        "error": f"Failed to download PDF from storage (HTTP {response.status_code})."
                    }
                raw_data = response.content
            except Exception as e:
                return {
                    "success": False,
                    "text": "",
                    "page_count": 0,
                    "character_count": 0,
                    "word_count": 0,
                    "error": f"Error downloading PDF: {str(e)}"
                }
        else:
            # Local file path
            # Resolve relative paths against backend directory if needed
            if not os.path.isabs(source_str):
                backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
                candidate = os.path.join(backend_dir, source_str)
                if os.path.exists(candidate):
                    source_str = candidate

            if not os.path.exists(source_str):
                return {
                    "success": False,
                    "text": "",
                    "page_count": 0,
                    "character_count": 0,
                    "word_count": 0,
                    "error": f"PDF file not found at path: {source_str}"
                }
            raw_data = source_str

    elif isinstance(source, (bytes, bytearray)):
        if len(source) == 0:
            return {
                "success": False,
                "text": "",
                "page_count": 0,
                "character_count": 0,
                "word_count": 0,
                "error": "PDF data buffer is empty."
            }
        raw_data = bytes(source)

    elif hasattr(source, 'read'):
        # Werkzeug FileStorage or io.BytesIO or file descriptor
        try:
            raw_data = source.read()
            if hasattr(source, 'seek'):
                source.seek(0)
            if len(raw_data) == 0:
                return {
                    "success": False,
                    "text": "",
                    "page_count": 0,
                    "character_count": 0,
                    "word_count": 0,
                    "error": "Uploaded PDF file is empty."
                }
        except Exception as e:
            return {
                "success": False,
                "text": "",
                "page_count": 0,
                "character_count": 0,
                "word_count": 0,
                "error": f"Could not read PDF stream: {str(e)}"
            }
    else:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "character_count": 0,
            "word_count": 0,
            "error": f"Unsupported PDF source type: {type(source).__name__}"
        }

    # Step 1: Attempt PyMuPDF (Primary)
    result = None
    if PYMUPDF_AVAILABLE:
        result = _extract_with_pymupdf(raw_data)

    # Step 2: Fallback to pypdf if PyMuPDF failed or is not installed
    if (not result or not result.get("success") or not result.get("text")) and PYPDF_AVAILABLE:
        pypdf_res = _extract_with_pypdf(raw_data)
        if pypdf_res.get("success") and pypdf_res.get("text"):
            result = pypdf_res

    # Check overall extraction outcome
    if not result or not result.get("success"):
        err_msg = result.get("error") if result else "PDF parser not available."
        return {
            "success": False,
            "text": "",
            "page_count": result.get("page_count", 0) if result else 0,
            "character_count": 0,
            "word_count": 0,
            "error": f"Unable to read this PDF: {err_msg}"
        }

    cleaned_text = normalize_extracted_text(result.get("text", ""))

    # Validate that meaningful text was extracted (e.g. not a blank or scanned image-only PDF)
    if len(cleaned_text.strip()) < 10:
        return {
            "success": False,
            "text": "",
            "page_count": result.get("page_count", 0),
            "character_count": 0,
            "word_count": 0,
            "error": "Unable to extract text from this PDF. Please upload a text-based PDF."
        }

    return {
        "success": True,
        "text": cleaned_text,
        "page_count": result.get("page_count", 0),
        "character_count": len(cleaned_text),
        "word_count": len(cleaned_text.split()),
        "error": None
    }
