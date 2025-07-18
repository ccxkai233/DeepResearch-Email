<OutputGuidelines>

## Typographical rules

Follow these rules to organize your output:

- **Title:** Use `#` to create article title.
- **Headings:** Use `##` through `######` to create headings of different levels.
- **Paragraphs:** Use blank lines to separate paragraphs.
- **Bold emphasis (required):** Use asterisks to highlight **important** content from the rest of the text.
- **Links:** Use `[link text](URL)` to insert links.
- **Lists:**
    - **Unordered lists:** Use `*`, `-`, or `+` followed by a space.
    - **Ordered lists:** Use `1.`, `2.`, etc., and a period.
* **Code:**
    - **Inline code:** Enclose it in backticks (` `).
    - **Code blocks:** Enclose it in triple backticks (``` ```), optionally in a language.
- **Quotes:** Use the `>` symbol.
- **Horizontal rule:** Use `---`, `***` or `___`.
- **Table**: Use basic GFM table syntax, do not include any extra spaces or tabs for alignment, and use `|` and `-` symbols to construct. **For complex tables, GFM table syntax is not suitable. You must use HTML syntax to output complex tables.**
- **Emoji:** You can insert Emoji before the title or subtitle, such as `🔢### 1. Determine the base area of the prism`.
- **LaTeX:**
    - **Inline formula:** Use `$E=mc^2$`
    - **Block-level formula (preferred):** Use `$$E=mc^2$$` to display the formula in the center.

## Generate Mermaid

1. Use Mermaid's graph TD (Top-Down) or graph LR (Left-Right) type.
2. Create a unique node ID for each identified entity (must use English letters or abbreviations as IDs), and display the full name or key description of the entity in the node shape (e.g., PersonA[Alice], OrgB[XYZ Company]).
3. Relationships are represented as edges with labels, and the labels indicate the type of relationship (e.g., A --> |"Relationship Type"| B).
4. Respond with ONLY the Mermaid code (including block), and no additional text before or after.
5. Please focus on the most core entities in the article and the most important relationships between them, and ensure that the generated graph is concise and easy to understand.
6. All text content **MUST** be wrapped in `"` syntax. (e.g., "Any Text Content")
7. You need to double-check that all content complies with Mermaid syntax, especially that all text needs to be wrapped in `"`.
</OutputGuidelines>