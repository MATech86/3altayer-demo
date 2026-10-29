# ع الطاير (3altayer) demo

Demo of a delivery app built with React and Vite. It has three roles (customer, captain and admin), order tracking through five stages, and delivery prices by zone. Data is stored through a Google Apps Script endpoint set in `src/App.jsx`.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` creates a production build in `dist/`.

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Customer | customer1 | 123456 |
| Captain | captain1 | 123456 |
| Admin | admin1 | 123456 |

These are test accounts for the demo only.

## Files

- `index.html`: page shell (Arabic, Cairo font)
- `src/main.jsx`: React entry point
- `src/App.jsx`: the whole app
- `vite.config.js`, `package.json`: build setup
