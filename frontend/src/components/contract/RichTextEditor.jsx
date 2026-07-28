import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import '../../styles/components/rich-text-editor.css';

function RichTextEditor({ content, onChange, editable = true, placeholder = 'Start writing...' }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor: e }) => {
      if (onChange) onChange(e.getHTML());
    },
  });

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, label, title, disabled }) => (
    <button
      type="button"
      className={`rte-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {label}
    </button>
  );

  const ToolbarDivider = () => <span className="rte-divider" />;

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar">
        {/* Text style */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph') && !editor.isActive('heading')}
          label="¶"
          title="Normal text"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label={<strong>B</strong>}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label={<em>I</em>}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          label={<u>U</u>}
          title="Underline"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label={<s>S</s>}
          title="Strikethrough"
        />
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          active={showColorPicker}
          label="A"
          title="Text color"
        />

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          label="H1"
          title="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
          title="Heading 3"
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="•"
          title="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="1."
          title="Ordered list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="❝"
          title="Blockquote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="―"
          title="Horizontal rule"
        />

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          label="≡"
          title="Align left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          label="≡"
          title="Align center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          label="≡"
          title="Align right"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          label="≡"
          title="Justify"
        />

        <ToolbarDivider />

        {/* Insert */}
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              setShowLinkInput(true);
              setLinkUrl(editor.getAttributes('link').href || '');
            } else {
              setShowLinkInput(true);
              setLinkUrl('');
            }
          }}
          active={editor.isActive('link')}
          label="🔗"
          title="Insert link"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          label="⊞"
          title="Insert table"
        />

        <ToolbarDivider />

        {/* Highlight */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#FFF3B0' }).run()}
          active={editor.isActive('highlight')}
          label="🖍"
          title="Highlight"
        />

        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="↶"
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="↷"
          title="Redo"
        />

        {/* Table actions (when in table) */}
        {editor.isActive('table') && (
          <>
            <ToolbarDivider />
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              label="|+"
              title="Add column after"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              label="+"
              title="Add row after"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              label="|-"
              title="Delete column"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              label="-"
              title="Delete row"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              label="⊞×"
              title="Delete table"
            />
          </>
        )}
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="rte-color-picker">
          {['#1B2430', '#B3261E', '#C68A2E', '#1F5C4C', '#7C8BC4', '#8A5FBF', '#5B6472', '#000000'].map(
            (c) => (
              <button
                key={c}
                type="button"
                className="rte-color-swatch"
                style={{ backgroundColor: c }}
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  setShowColorPicker(false);
                }}
                title={c}
              />
            )
          )}
          <button
            type="button"
            className="rte-color-swatch rte-color-reset"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setShowColorPicker(false);
            }}
            title="Remove color"
          >
            ×
          </button>
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="rte-link-input">
          <input
            type="url"
            className="form-input"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
            autoFocus
          />
          <button type="button" className="btn btn-sm btn-primary" onClick={handleSetLink}>
            Apply
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowLinkInput(false)}>
            Cancel
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}

export default RichTextEditor;
