# Where these files come from

Every file here was downloaded from legacy's MWNF portal on 2026-11-14: the chrome of its
database search page (`https://www.museumwnf.org/database_searchform.php`), which the search
site takes its look from (inventory-app M15, Pascal 2026-11-14). The site keeps its own copy:
nothing is served from the legacy site.

| File | Legacy URL | sha256 | Used in |
|---|---|---|---|
| `public/favicon.ico` (served as is, so it lives in `public/`, not here) | https://www.museumwnf.org/favicon.ico | `35ee0786acc6fd844652b764fc5f58be3c664ce299c70a754b40f5d8a89c7496` | `index.html` |
| `logo_inside.png` | https://www.museumwnf.org/responsive/images/logo_inside.png | `1f17bace0ca1e67d9b222d051787dfefe5396598fe10e603df2a807cc97fa308` | the header (`src/dataset.config.js`, `standalone.logo`) |
| `banner_inside.jpg` | https://www.museumwnf.org/responsive/images/banner_inside.jpg | `e17b1e48c1916db042c4fd279e70c39f58a16088b9091f3bc5de5add2f678a8f` | the banner (`src/dataset.config.js`, `standalone.banner`) |
| `next_arrow.png` | https://www.museumwnf.org/responsive/images/next_arrow.png | `e76f547aad69e9b966f4811561e3cf691c9d5d53da0e3027be9a94d2b9977c72` | the family's bullets (`theme/tokens.css`) |
| `back_arrow.png` | https://www.museumwnf.org/responsive/images/back_arrow.png | `6df49624eb37ca1a6e8c20a4defaf1a772c75bd4ee835447a84dc8822496f9be` | the family's way back (`theme/tokens.css`) |
| `white_next_arrow.png` | https://www.museumwnf.org/responsive/images/white_next_arrow.png | `7de5d208969344945227ed0cadd07ef73397dadb0b344f4af4542ca42505e860` | the family's white bullets (`theme/tokens.css`) |
| `white_back_arrow.png` | https://www.museumwnf.org/responsive/images/white_back_arrow.png | `318a61bd87e0902b900cb3273e897040161b39ca35003cedbdeeebe395973a10` | the family's white way back (`theme/tokens.css`) |

The portal serves no copy of the family's other pictures (`select.png`, `partner_bg.jpg`,
`download_white.png`, the timeline's): `theme/tokens.css` sets those tokens to `none`. None of
them is on the search page.
