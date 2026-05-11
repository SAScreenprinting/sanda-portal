# Garment Images

Place product mockup images here for use in the Design Studio and Order pages.

## Naming Convention

```
{SKU}_{color}_{view}.{ext}
```

Examples:
- `G5000_White_front.png`
- `G5000_Black_back.png`
- `G18500_Navy_front.png`
- `BC3001_Athletic_Heather_front.png`

## Supported formats
- PNG (preferred — supports transparency)
- JPG
- WebP

## Recommended specs
- **Size:** 800×800 px minimum
- **Background:** Transparent (PNG) or white
- **Resolution:** 72–144 dpi for web use

## SKU Reference

| SKU       | Product                          |
|-----------|----------------------------------|
| G5000     | Gildan 5000 Heavy Cotton Tee     |
| G64000    | Gildan 64000 Softstyle Tee       |
| G2000     | Gildan 2000 Ultra Cotton Tee     |
| BC3001    | Bella+Canvas 3001 Unisex Tee     |
| PC61      | Port & Company PC61 Essential    |
| G18500    | Gildan 18500 Heavy Blend Hoodie  |
| BC3719    | Bella+Canvas 3719 Fleece Hoodie  |
| G18000    | Gildan 18000 Crewneck            |
| DT1100    | District DT1100 Fleece Crewneck  |
| K500      | Port Authority K500 Polo         |
| ST650     | Sport-Tek ST650 Polo             |
| MM1004    | Mercer+Mettle MM1004 Polo        |
| C112      | Port Authority C112 Snapback     |
| R112      | Richardson 112 Trucker Cap       |
| CP90      | Port & Company CP90 Beanie       |
| B600      | Port & Company B600 Tote Bag     |
| BG615     | Port Authority BG615 Backpack    |
| J317      | Port Authority J317 Soft Shell   |
| CT102208  | Carhartt CT102208 Jacket         |
| JST60     | Sport-Tek JST60 Colorblock       |

## Usage in code

```jsx
// Reference from any page:
<img src={`/garments/${sku}_${color}_front.png`} alt={productName} />

// Or in Next.js Image component:
<Image src={`/garments/G5000_White_front.png`} alt="Gildan 5000 White" width={800} height={800} />
```

## Where to get garment images

- **SSActivewear CDN** (already used in Design Studio): `https://cdn.ssactivewear.com/Images/styles/{SKU}/{Color}_1.jpg`
- **SanMar** product images
- Your own photography / supplier mockups
