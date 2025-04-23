---
path: features/markdown-examples
title: Markdown Examples
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [feature, markdown, formatting, examples]
---

# Markdown Examples

This page demonstrates various Markdown formatting options available in NextWiki.

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Text Formatting

*This text is italic.*
_This is also italic._

**This text is bold.**
__This is also bold.__

***This text is bold and italic.***
___This is also bold and italic.___

~~This text is strikethrough.~~

## Lists

### Unordered List

- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

### Ordered List

1. First item
2. Second item
3. Third item
   1. Sub-item 3.1
   2. Sub-item 3.2

## Links

[Visit the NextWiki GitHub Repository](https://github.com/barisgit/nextwiki)

[Go to Getting Started](./../getting-started.md) (Example of a relative link)

## Blockquotes

> This is a blockquote. It's useful for quoting text from another source.
> > Blockquotes can be nested.

### Styled Blockquotes (Admonitions)

NextWiki supports styled blockquotes, similar to admonitions in Wiki.js, by adding a class after the quote:

> :information_source: This is an informational message.
> {.is-info}

> :warning: This is a warning message.
> {.is-warning}

> :bulb: This is a tip or suggestion.
> {.is-tip}

(Note: The available classes like `.is-info`, `.is-warning`, `.is-tip` depend on the configured CSS.)

## Code

Inline `code` example.

```javascript
// Code block example
function greet(name) {
  console.log(`Hello, ${name}!`);
}
greet('World');
```

## Horizontal Rule

Use three or more hyphens, asterisks, or underscores:

---

***

___

### Styled Link Lists

You can apply styles to lists of links using a class identifier:

- [:icon: Example Link 1 \_Description 1_](./path-to-page-1)
- [:icon: Example Link 2 \_Description 2_](./path-to-page-2)
{.links-list}

(Note: The appearance depends on the CSS rules for `.links-list`.) 