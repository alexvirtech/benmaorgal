const APPEARANCE_CATALOG = {
  body: [
    { id: 'body-default', label: 'Stocky', width: 1, height: 1 },
    { id: 'body-round', label: 'Round', width: 1.15, height: 0.9 },
    { id: 'body-compact', label: 'Compact', width: 0.9, height: 1.1 },
    { id: 'body-tall', label: 'Tall', width: 0.85, height: 1.2 },
    { id: 'body-big', label: 'Big', width: 1.25, height: 1.1 },
    { id: 'body-tiny', label: 'Tiny', width: 0.8, height: 0.85 },
  ],
  face: [
    { id: 'face-friendly', label: 'Friendly', eyes: 'round', mouth: 'smile', brows: 'normal' },
    { id: 'face-brave', label: 'Brave', eyes: 'narrow', mouth: 'grin', brows: 'angled' },
    { id: 'face-funny', label: 'Funny', eyes: 'big', mouth: 'open', brows: 'raised' },
    { id: 'face-serious', label: 'Serious', eyes: 'narrow', mouth: 'flat', brows: 'low' },
    { id: 'face-angry', label: 'Angry', eyes: 'narrow', mouth: 'frown', brows: 'angled' },
    { id: 'face-cool', label: 'Cool', eyes: 'round', mouth: 'smirk', brows: 'normal' },
    { id: 'face-shocked', label: 'Shocked', eyes: 'big', mouth: 'open', brows: 'raised' },
    { id: 'face-sleepy', label: 'Sleepy', eyes: 'narrow', mouth: 'flat', brows: 'normal' },
  ],
  hairHat: [
    { id: 'hair-none', label: 'None', type: 'none' },
    { id: 'hair-simple', label: 'Short Hair', type: 'hair', color: '#5a3a1a' },
    { id: 'hair-black', label: 'Black Hair', type: 'hair', color: '#1a1a1a' },
    { id: 'hair-blonde', label: 'Blonde Hair', type: 'hair', color: '#e8c040' },
    { id: 'hair-red', label: 'Red Hair', type: 'hair', color: '#cc4422' },
    { id: 'hair-spiky', label: 'Spiky Yellow', type: 'spiky', color: '#ffcc00' },
    { id: 'hair-spiky-blue', label: 'Spiky Blue', type: 'spiky', color: '#4488ff' },
    { id: 'hair-spiky-pink', label: 'Spiky Pink', type: 'spiky', color: '#ff66aa' },
    { id: 'hat-cap-red', label: 'Red Cap', type: 'cap', color: '#dd3333' },
    { id: 'hat-cap-blue', label: 'Blue Cap', type: 'cap', color: '#3355cc' },
    { id: 'hat-cap-black', label: 'Black Cap', type: 'cap', color: '#222222' },
    { id: 'hat-cap-gold', label: 'Gold Cap', type: 'cap', color: '#cc9922' },
    { id: 'hat-helmet', label: 'Helmet', type: 'helmet', color: '#888899' },
    { id: 'hat-helmet-gold', label: 'Gold Helmet', type: 'helmet', color: '#ccaa44' },
    { id: 'hat-beanie', label: 'Green Beanie', type: 'beanie', color: '#44aa44' },
    { id: 'hat-beanie-red', label: 'Red Beanie', type: 'beanie', color: '#cc3333' },
    { id: 'hat-beanie-blue', label: 'Blue Beanie', type: 'beanie', color: '#3366cc' },
    { id: 'hat-crown', label: 'Crown', type: 'crown', color: '#ffd700' },
    { id: 'hat-bandana', label: 'Bandana', type: 'bandana', color: '#cc2222' },
    { id: 'hat-tophat', label: 'Top Hat', type: 'tophat', color: '#222222' },
  ],
  shirt: [
    { id: 'shirt-red', label: 'Red Tee', color: '#dd3333', accent: '#bb2222' },
    { id: 'shirt-blue', label: 'Blue Jacket', color: '#3366cc', accent: '#2244aa' },
    { id: 'shirt-yellow', label: 'Yellow Tee', color: '#ddbb22', accent: '#bb9911' },
    { id: 'shirt-green', label: 'Green Vest', color: '#33aa44', accent: '#228833' },
    { id: 'shirt-purple', label: 'Purple Hoodie', color: '#8844bb', accent: '#6633aa' },
    { id: 'shirt-black', label: 'Black Tee', color: '#333333', accent: '#1a1a1a' },
    { id: 'shirt-white', label: 'White Tee', color: '#dddddd', accent: '#bbbbbb' },
    { id: 'shirt-orange', label: 'Orange Tee', color: '#ee7722', accent: '#cc5511' },
    { id: 'shirt-pink', label: 'Pink Tee', color: '#ee66aa', accent: '#cc4488' },
    { id: 'shirt-camo', label: 'Camo', color: '#556644', accent: '#445533' },
    { id: 'shirt-striped', label: 'Striped', color: '#3366cc', accent: '#dd3333' },
    { id: 'shirt-armor', label: 'Armor', color: '#778899', accent: '#556677' },
  ],
  pants: [
    { id: 'pants-jeans', label: 'Jeans', color: '#445588', accent: '#334477' },
    { id: 'pants-shorts', label: 'Shorts', color: '#cc8844', accent: '#aa6633', short: true },
    { id: 'pants-dark', label: 'Dark Pants', color: '#333344', accent: '#222233' },
    { id: 'pants-combat', label: 'Combat', color: '#556644', accent: '#445533' },
    { id: 'pants-white', label: 'White Pants', color: '#cccccc', accent: '#aaaaaa' },
    { id: 'pants-red', label: 'Red Pants', color: '#cc3333', accent: '#aa2222' },
    { id: 'pants-blue-shorts', label: 'Blue Shorts', color: '#3366cc', accent: '#2244aa', short: true },
    { id: 'pants-black-shorts', label: 'Black Shorts', color: '#222222', accent: '#111111', short: true },
    { id: 'pants-gold', label: 'Gold Pants', color: '#ccaa44', accent: '#aa8833' },
    { id: 'pants-cargo', label: 'Cargo', color: '#887755', accent: '#665544' },
  ],
  accessory: [
    { id: 'acc-none', label: 'None', type: 'none' },
    { id: 'acc-glasses', label: 'Glasses', type: 'glasses', color: '#333333' },
    { id: 'acc-sunglasses', label: 'Sunglasses', type: 'sunglasses', color: '#111111' },
    { id: 'acc-backpack', label: 'Backpack', type: 'backpack', color: '#886633' },
    { id: 'acc-scarf', label: 'Red Scarf', type: 'scarf', color: '#dd4444' },
    { id: 'acc-scarf-blue', label: 'Blue Scarf', type: 'scarf', color: '#3366cc' },
    { id: 'acc-cape', label: 'Red Cape', type: 'cape', color: '#cc2222' },
    { id: 'acc-cape-blue', label: 'Blue Cape', type: 'cape', color: '#2244cc' },
    { id: 'acc-cape-gold', label: 'Gold Cape', type: 'cape', color: '#ccaa22' },
    { id: 'acc-medal', label: 'Medal', type: 'medal', color: '#ffd700' },
    { id: 'acc-chain', label: 'Chain', type: 'chain', color: '#cccccc' },
    { id: 'acc-bandolier', label: 'Bandolier', type: 'bandolier', color: '#665544' },
  ],
}

const SKIN_COLORS = [
  '#f5c5a3', '#e8b48a', '#d4956b', '#bb7a52', '#8d5a3c',
  '#f0d5b8', '#c68642', '#6b4226', '#3b2210', '#ffccaa',
]

const DEFAULT_APPEARANCE = {
  body: 'body-default',
  face: 'face-friendly',
  hairHat: 'hair-none',
  shirt: 'shirt-red',
  pants: 'pants-jeans',
  weapon: 'pistol',
  accessory: 'acc-none',
  skinColor: 0,
  brawlCharacter: 'sirius',
}

function getAppearanceItem(category, id) {
  const list = APPEARANCE_CATALOG[category]
  if (!list) return null
  return list.find(item => item.id === id) || list[0]
}

const VALID_BRAWL_CHARACTERS = ['sirius', 'kenji', 'nori']

function validateAppearance(app) {
  const result = {}
  for (const key of Object.keys(DEFAULT_APPEARANCE)) {
    if (key === 'skinColor') {
      const v = parseInt(app?.[key])
      result[key] = (v >= 0 && v < SKIN_COLORS.length) ? v : 0
      continue
    }
    if (key === 'weapon') {
      const w = WEAPON_CATALOG.find(w => w.id === app?.[key])
      result[key] = w ? app[key] : DEFAULT_APPEARANCE[key]
      continue
    }
    if (key === 'brawlCharacter') {
      result[key] = VALID_BRAWL_CHARACTERS.includes(app?.[key]) ? app[key] : 'sirius'
      continue
    }
    const cat = APPEARANCE_CATALOG[key]
    if (cat) {
      const valid = cat.find(item => item.id === app?.[key])
      result[key] = valid ? app[key] : DEFAULT_APPEARANCE[key]
    } else {
      result[key] = DEFAULT_APPEARANCE[key]
    }
  }
  return result
}
