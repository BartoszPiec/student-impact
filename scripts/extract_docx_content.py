#!/usr/bin/env python3
"""
Extract full content from WZORCOWA DOCX files and generate SQL UPDATE statements.
Splits each DOCX into public description and locked_content (internal section).
Formats content as markdown for MarkdownLite component rendering.
"""

import sys
import os
import glob
import zipfile
import xml.etree.ElementTree as ET
import json
import re

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

NAMESPACE = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def is_bold_run(run):
    """Check if a run element has bold formatting."""
    rpr = run.find('w:rPr', NAMESPACE)
    if rpr is not None:
        b = rpr.find('w:b', NAMESPACE)
        if b is not None:
            val = b.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
            if val is None or val != '0':
                return True
    return False

def get_paragraph_style(para):
    """Get the paragraph style name."""
    ppr = para.find('w:pPr', NAMESPACE)
    if ppr is not None:
        pstyle = ppr.find('w:pStyle', NAMESPACE)
        if pstyle is not None:
            return pstyle.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '')
    return ''

def is_list_paragraph(para):
    """Check if paragraph is a list item."""
    ppr = para.find('w:pPr', NAMESPACE)
    if ppr is not None:
        numpr = ppr.find('w:numPr', NAMESPACE)
        if numpr is not None:
            return True
    style = get_paragraph_style(para)
    if 'List' in style:
        return True
    return False

def extract_paragraph_text(para):
    """Extract text from a paragraph with bold markdown markers."""
    runs = para.findall('.//w:r', NAMESPACE)
    parts = []
    current_bold = False
    current_text = []

    for run in runs:
        bold = is_bold_run(run)
        texts = []
        for t in run.findall('.//w:t', NAMESPACE):
            if t.text:
                texts.append(t.text)
        text = ''.join(texts)
        if not text:
            continue

        if bold != current_bold:
            if current_text:
                joined = ''.join(current_text)
                if current_bold:
                    parts.append(f'**{joined}**')
                else:
                    parts.append(joined)
                current_text = []
            current_bold = bold
        current_text.append(text)

    if current_text:
        joined = ''.join(current_text)
        if current_bold:
            parts.append(f'**{joined}**')
        else:
            parts.append(joined)

    return ''.join(parts)

def extract_table(tbl):
    """Extract table as markdown table."""
    rows = tbl.findall('.//w:tr', NAMESPACE)
    table_data = []

    for row in rows:
        cells = row.findall('.//w:tc', NAMESPACE)
        row_data = []
        for cell in cells:
            cell_texts = []
            for para in cell.findall('.//w:p', NAMESPACE):
                text = extract_paragraph_text(para).strip()
                if text:
                    cell_texts.append(text)
            row_data.append(' '.join(cell_texts))
        table_data.append(row_data)

    if not table_data:
        return ''

    # Build markdown table
    lines = []
    if table_data:
        # Header row
        header = table_data[0]
        lines.append('| ' + ' | '.join(header) + ' |')
        lines.append('| ' + ' | '.join(['---'] * len(header)) + ' |')
        # Data rows
        for row in table_data[1:]:
            # Pad row to match header length
            while len(row) < len(header):
                row.append('')
            lines.append('| ' + ' | '.join(row[:len(header)]) + ' |')

    return '\n'.join(lines)

def extract_docx_structured(path):
    """Extract full DOCX content with formatting as markdown."""
    with zipfile.ZipFile(path, 'r') as z:
        xml_content = z.read('word/document.xml')

    root = ET.fromstring(xml_content)
    body = root.find('.//w:body', NAMESPACE)
    if body is None:
        return '', ''

    elements = []
    for child in body:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag

        if tag == 'p':
            text = extract_paragraph_text(child).strip()
            if text:
                style = get_paragraph_style(child)
                is_list = is_list_paragraph(child)

                # Detect headers by style
                is_heading = False
                heading_level = 0
                if 'Heading' in style or 'heading' in style:
                    is_heading = True
                    # Try to get level number
                    for ch in style:
                        if ch.isdigit():
                            heading_level = int(ch)
                            break
                    if heading_level == 0:
                        heading_level = 2

                if is_heading:
                    # Remove bold markers from headings (they're already bold)
                    clean_text = text.replace('**', '')
                    prefix = '#' * min(heading_level + 1, 4)  # ### for h2, #### for h3
                    elements.append(f'{prefix} {clean_text}')
                elif is_list:
                    elements.append(f'* {text}')
                else:
                    elements.append(text)

        elif tag == 'tbl':
            table_md = extract_table(child)
            if table_md:
                elements.append(table_md)

    return elements

def split_public_internal(elements):
    """Split content into public (description) and internal (locked_content) sections."""
    internal_markers = [
        'SEKCJA WEWNĘTRZNA',
        'SEKCJA WEWNĘTRZNA — DLA STUDENTA-WYKONAWCY',
        'SEKCJA WEWNĘTRZNA — DLA STUDENTA',
        'DLA STUDENTA-WYKONAWCY',
    ]

    split_idx = None
    for i, elem in enumerate(elements):
        clean = elem.replace('**', '').replace('#', '').strip()
        for marker in internal_markers:
            if marker in clean.upper() or marker in clean:
                split_idx = i
                break
        if split_idx is not None:
            break

    if split_idx is None:
        # No internal section found - all is public
        return elements, []

    public = elements[:split_idx]
    internal = elements[split_idx:]

    return public, internal

def format_section(elements, skip_metadata=True):
    """Format elements into markdown text, optionally skipping metadata header."""
    if not elements:
        return ''

    # Skip metadata fields at top (title, subtitle, category, executor, price, delivery)
    start_idx = 0
    if skip_metadata:
        metadata_keywords = ['Kategoria:', 'Wykonawca:', 'Cena:', 'Czas realizacji:',
                            'PLN brutto', 'PLN', 'Student ', 'dni roboczych']
        # Find where the real content starts (after "O co chodzi" or similar)
        content_markers = ['O co chodzi', 'Opis usługi', 'Co to jest', 'Na czym polega']

        for i, elem in enumerate(elements):
            clean = elem.replace('**', '').replace('#', '').strip()
            for marker in content_markers:
                if marker.lower() in clean.lower():
                    start_idx = i
                    break
            if start_idx > 0:
                break

        # If we didn't find a content marker, look for the first heading-style element
        # after the initial metadata block
        if start_idx == 0:
            # Skip first 10 elements max for metadata
            for i, elem in enumerate(elements[:15]):
                if i < 2:  # Skip title and subtitle
                    continue
                clean = elem.replace('**', '').replace('#', '').strip()
                # Check if this looks like a section header
                if clean.startswith('###') or (clean.startswith('**') and len(clean) < 80):
                    start_idx = i
                    break
            # If still not found, start from index 2 (skip title + subtitle)
            if start_idx == 0 and len(elements) > 2:
                start_idx = 2

    # Build the text
    result_parts = []
    prev_was_table = False
    prev_was_list = False

    for elem in elements[start_idx:]:
        is_table = elem.startswith('|')
        is_list = elem.startswith('* ')
        is_heading = elem.startswith('#')

        # Add spacing
        if is_heading and result_parts:
            result_parts.append('')  # blank line before heading

        if is_table and not prev_was_table and result_parts:
            result_parts.append('')  # blank line before table

        if is_list and not prev_was_list and result_parts and not result_parts[-1] == '':
            result_parts.append('')  # blank line before list start

        result_parts.append(elem)

        if is_table and not is_table:
            result_parts.append('')  # blank line after table

        prev_was_table = is_table
        prev_was_list = is_list

    text = '\n'.join(result_parts)

    # Clean up excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()

def format_internal_section(elements):
    """Format internal/locked content."""
    if not elements:
        return ''

    # Skip the section header itself
    start_idx = 0
    for i, elem in enumerate(elements[:3]):
        clean = elem.replace('**', '').replace('#', '').strip()
        if 'SEKCJA WEWNĘTRZNA' in clean.upper() or 'Ta sekcja nie jest widoczna' in clean:
            start_idx = i + 1
            continue
        if 'Ta sekcja nie jest widoczna' in clean:
            start_idx = i + 1

    # Also skip "Ta sekcja nie jest widoczna" disclaimer
    while start_idx < len(elements):
        clean = elements[start_idx].replace('**', '').replace('#', '').strip()
        if 'Ta sekcja nie jest widoczna' in clean or 'SEKCJA WEWNĘTRZNA' in clean.upper():
            start_idx += 1
        else:
            break

    result_parts = []
    prev_was_table = False
    prev_was_list = False

    for elem in elements[start_idx:]:
        is_table = elem.startswith('|')
        is_list = elem.startswith('* ')
        is_heading = elem.startswith('#')

        if is_heading and result_parts:
            result_parts.append('')
        if is_table and not prev_was_table and result_parts:
            result_parts.append('')
        if is_list and not prev_was_list and result_parts and result_parts[-1] != '':
            result_parts.append('')

        result_parts.append(elem)
        prev_was_table = is_table
        prev_was_list = is_list

    text = '\n'.join(result_parts)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def get_title_from_elements(elements):
    """Extract the title (first non-empty element)."""
    for elem in elements:
        clean = elem.replace('**', '').replace('#', '').strip()
        if clean and len(clean) > 5:
            return clean
    return ''

def escape_sql(text):
    """Escape text for SQL string literal."""
    return text.replace("'", "''")

def main():
    docx_dir = glob.glob(r'C:\Users\Bartosz i Natalia\Desktop\Pakiety Us*')[0]
    docx_files = sorted(glob.glob(os.path.join(docx_dir, '*_WZORCOWA_*.docx')))

    print(f"Found {len(docx_files)} DOCX files")
    print("=" * 80)

    results = []

    for filepath in docx_files:
        filename = os.path.basename(filepath)
        # Skip NDA template
        if 'NDA' in filename:
            continue

        print(f"\nProcessing: {filename}")

        try:
            elements = extract_docx_structured(filepath)
            title = get_title_from_elements(elements)

            public_elements, internal_elements = split_public_internal(elements)

            description = format_section(public_elements, skip_metadata=True)
            locked_content = format_internal_section(internal_elements)

            print(f"  Title: {title[:80]}")
            print(f"  Description length: {len(description)} chars")
            print(f"  Locked content length: {len(locked_content)} chars")
            print(f"  Public elements: {len(public_elements)}")
            print(f"  Internal elements: {len(internal_elements)}")

            results.append({
                'filename': filename,
                'title': title,
                'description': description,
                'locked_content': locked_content,
            })

        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback
            traceback.print_exc()

    # Generate SQL file
    sql_lines = []
    sql_lines.append("-- Generated SQL UPDATE statements for WZORCOWA packages")
    sql_lines.append("-- Updates description and locked_content with full DOCX content")
    sql_lines.append(f"-- Total packages: {len(results)}")
    sql_lines.append("")

    for r in results:
        title_match = r['title']
        # Use first 40 chars of title for LIKE matching (some titles have special chars)
        title_prefix = title_match[:40].replace("'", "''")

        sql_lines.append(f"-- Package: {r['title'][:80]}")
        sql_lines.append(f"-- Source: {r['filename']}")
        sql_lines.append(f"UPDATE service_packages")
        sql_lines.append(f"SET description = '{escape_sql(r['description'])}',")
        sql_lines.append(f"    locked_content = '{escape_sql(r['locked_content'])}'")
        sql_lines.append(f"WHERE title LIKE '{title_prefix}%' AND is_system = true;")
        sql_lines.append("")

    # Write SQL file
    sql_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'update_descriptions.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    print(f"\n\nSQL file written to: {sql_path}")

    # Also write a JSON summary for inspection
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docx_content.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"JSON file written to: {json_path}")

    # Print sample of first result
    if results:
        print("\n" + "=" * 80)
        print("SAMPLE: First package description (first 1000 chars)")
        print("=" * 80)
        print(results[0]['description'][:1000])
        print("\n" + "=" * 80)
        print("SAMPLE: First package locked_content (first 500 chars)")
        print("=" * 80)
        print(results[0]['locked_content'][:500])

if __name__ == '__main__':
    main()
