# Net Worth Dashboard

A simple static website that reads a public Google Sheet and displays five categories:

- Total Assets
- Total Liabilities
- Net Worth
- Investible Net Worth
- FIRE

## How to upload to GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js` into the repository.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.

GitHub will give you a public website link after it deploys.

## Change the Google Sheet

Open `script.js` and edit these two lines:

```js
const SHEET_ID = "1g2-5y9fO-Fp191g7AF61fI9my9-omGvq0Va7Ha0WFXc";
const SHEET_GID = "123456789";
```

The sheet must be shared as **Anyone with the link → Viewer**.

## Notes

The site includes fallback data from the current sheet so the page still displays if the live Google Sheet request is blocked.
