---
path: features/code-syntax-highlighting
title: Code Syntax Highlighting
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [feature, code, syntax, highlighting, examples]
---

# Code Syntax Highlighting

NextWiki supports syntax highlighting for various programming languages using code blocks.

## JavaScript

```javascript
import { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds => seconds + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      Seconds: {seconds}
    </div>
  );
}
```

## Python

```python
import requests

def get_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

# Example usage
api_url = "https://jsonplaceholder.typicode.com/todos/1"
data = get_data(api_url)
if data:
    print(data)
```

## HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<h1>This is a Heading</h1>
<p>This is a paragraph.</p>

<button id="myButton">Click Me</button>

<script src="script.js"></script>
</body>
</html>
```

## CSS

```css
body {
  font-family: sans-serif;
  margin: 20px;
  background-color: #f0f0f0;
}

h1 {
  color: #333;
  text-align: center;
}

#myButton {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

#myButton:hover {
  background-color: #0056b3;
}
```

## SQL (PostgreSQL)

```sql
-- Select users created in the last week
SELECT
    user_id,
    username,
    email,
    created_at
FROM
    users
WHERE
    created_at >= current_date - interval '7 days'
ORDER BY
    created_at DESC;
``` 