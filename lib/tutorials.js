// Step-by-step guides shown on the portal's Tutorials page.
// Only describe things the portal really does. Keep steps short and in the order a person would click.
export const TUTORIAL_CATEGORIES = ['Getting started', 'Designing', 'Selling', 'Orders', 'Help'];

export const TUTORIALS = [
  {
    id: 'how-it-works', category: 'Getting started', title: 'How S&A POD works', time: '2 min',
    intro: 'You design the product, we print it, pack it and ship it straight to your customer. You never hold stock.',
    steps: [
      'Create a design in the Design Studio.',
      'S&A reviews it. When it is approved, it gets a SKU.',
      'Put the product in your online store with that SKU (or publish it from the portal).',
      'A customer buys it from your store.',
      'S&A prints and ships the order, and the tracking number goes back to your store automatically.',
    ],
    tip: 'You only pay for what actually sells. Check Pricing and profit on any design to see your cost and your profit.',
  },
  {
    id: 'sign-in', category: 'Getting started', title: 'Sign in and set up your account', time: '1 min',
    intro: 'Your portal login is your email and a password.',
    steps: [
      'Go to portal.sandascreenprinting.com and sign in.',
      'Forgot your password? Click Forgot password? on the sign-in page and follow the email.',
      'Open Settings to add your business name, contact name and phone number.',
      'To change your password later, use Change password on the Settings page.',
    ],
  },
  {
    id: 'create-design', category: 'Designing', title: 'Create a design in the Design Studio', time: '5 min',
    intro: 'Design on a real product and see exactly how it will print.',
    steps: [
      'Open Design Studio from the sidebar and pick a product.',
      'Choose the color and size you want to start with.',
      'Use the tools on the left to upload your artwork, add text, or add clipart. Keep everything inside the print area.',
      'Switch between Front and Back to design each side.',
      'Click Save Design to My Portal.',
      'You will see a Design number, like Design #219868. Click View design to open it.',
    ],
    tip: 'Use a high quality file with a transparent background for the sharpest print. The Print file check on your design page warns you about small or busy files.',
  },
  {
    id: 'approval', category: 'Designing', title: 'Get your design approved', time: '2 min',
    intro: 'Every design is reviewed by S&A before it can be sold.',
    steps: [
      'After you save, your design shows Submitted on the Designs page.',
      'S&A reviews it and either approves it or sends it back with a reason.',
      'Approved: your design gets a SKU and moves on to In setup, then Live.',
      'Denied: open the design to read the reason, fix the problem, and create a revised design.',
      'Status changes also arrive by email.',
    ],
  },
  {
    id: 'sku', category: 'Designing', title: 'What your SKU means', time: '1 min',
    intro: 'The SKU is how our system recognizes your product when it sells.',
    steps: [
      'It looks like POD-219868-BLA-S: POD, then your design number, then the color, then the size.',
      'Find it on your design page under Details, and on the approval email.',
      'Use it exactly as shown when you create the product in your store. One wrong character means the order will not match.',
    ],
    tip: 'Do not change the SKU in your store after you publish.',
  },
  {
    id: 'pricing', category: 'Selling', title: 'Set your price and see your profit', time: '2 min',
    intro: 'Work out what to charge before you list a product.',
    steps: [
      'Open one of your designs.',
      'Find the Pricing and profit card. It shows your cost per item.',
      'Type the price you plan to sell it for.',
      'Your profit per sale and your margin update as you type.',
      'Click Save price. The price is used when you publish.',
    ],
    tip: 'If the card says pricing has not been set up yet, S&A has not added costs for that product. Send us a message and we will add them.',
  },
  {
    id: 'connect-app', category: 'Selling', title: 'Connect your Shopify store with S&A Studios', time: '3 min',
    intro: 'This is the way that lets your sales reach us automatically.',
    steps: [
      'Install the S&A Studios app on your Shopify store. S&A will send you the install link.',
      'In the app, open S&A POD.',
      'In this portal, open Stores and copy your connection code.',
      'Paste the code into the app and click Connect.',
      'You will see your business name shown as connected.',
    ],
    tip: 'Only sales of your own approved designs are matched to you. Nobody else can pull your files.',
  },
  {
    id: 'publish', category: 'Selling', title: 'Publish a design to your store', time: '3 min',
    intro: 'Add an approved design to your Shopify store without typing the product in by hand.',
    steps: [
      'Open Stores and connect your Shopify store (follow the steps on that page to get your access token).',
      'Open an approved design.',
      'In Publish to your store, choose your store and check the title, description and price.',
      'Leave Save as a draft ticked so you can review it in Shopify first.',
      'Click Publish. A link to the new product appears when it is done.',
      'In Shopify, look over the product and make it live when you are happy.',
    ],
  },
  {
    id: 'manual-product', category: 'Selling', title: 'Create the product yourself in Shopify', time: '4 min',
    intro: 'You can also list a design without using Publish.',
    steps: [
      'In your Shopify admin, go to Products and click Add product.',
      'Add your title, photos and price. Download your mockups from the design page for photos.',
      'In the variant section, paste the SKU from your design exactly.',
      'Save the product and make it available on your store.',
    ],
    tip: 'On your design page, Download all (.zip) gives you the mockups and print files in one file.',
  },
  {
    id: 'track-orders', category: 'Orders', title: 'Track your orders', time: '1 min',
    intro: 'See every sale from your store and where it is in production.',
    steps: [
      'Open Orders and choose the Store orders tab.',
      'Each order shows New, In production or Shipped.',
      'When it ships, the tracking number appears here and your customer is emailed by Shopify.',
    ],
  },
  {
    id: 'samples', category: 'Orders', title: 'Order a sample', time: '1 min',
    intro: 'See and feel the finished product before you sell it.',
    steps: [
      'Open an approved design.',
      'In Order a sample, choose how many and add a size or note.',
      'Click Request sample. S&A will confirm the cost and timing.',
      'Follow its progress and tracking on the same card.',
    ],
  },
  {
    id: 'files', category: 'Orders', title: 'View and download your files', time: '1 min',
    intro: 'Check your artwork at full size without downloading first.',
    steps: [
      'Open a design and find Print files.',
      'Click a file to open it. Use the plus and minus buttons to zoom in.',
      'Switch the background between Checker, White and Black to see how it looks on light and dark shirts.',
      'Click Download print file to save it.',
    ],
  },
  {
    id: 'missing-order', category: 'Help', title: 'A sale did not show up in my orders', time: '2 min',
    intro: 'Check these in order.',
    steps: [
      'Is your store connected? Open the S&A POD page in the S&A Studios app. It should show your business name.',
      'Is the design approved? Only approved designs have a SKU.',
      'Does the SKU in your store match exactly? Compare it with the SKU on your design page.',
      'Was the order placed after you connected? Earlier orders are not brought in.',
      'Still stuck? Open Messages and send us the order number.',
    ],
  },
  {
    id: 'contact', category: 'Help', title: 'Get help from S&A', time: '1 min',
    intro: 'We are here if something is not working.',
    steps: [
      'Open Messages and click New message. Include your design number or order number.',
      'Or call (201) 949-8343.',
      'For anything about a shipment, include the order number.',
    ],
  },
];
