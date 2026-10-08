# Asset Allocation Calculator

This is an isolated copy of the public ETF asset-allocation calculator.

## Password-gated deployment

Deploy this Next.js app to Vercel (do not use GitHub Pages/static export). In the Vercel project, add `CALCULATOR_PASSWORD` as a Production environment variable, set a unique high-entropy shared passphrase there, then redeploy. The app redirects visitors to `/login`; successful login sets a signed, HttpOnly cookie that expires after 14 days. Wrong passwords are rejected. The production password must never be committed or sent in chat.

The GitHub repository is public and contains the calculator source and historical ETF return data. The password gate restricts the app page, not access to public source files or the public dataset. Do not add account holdings, credentials, or other private data to this repository. Once the Vercel deployment is verified, disable GitHub Pages so its old unprotected URL cannot bypass the password gate.
