// Produktlisten sender id'et med i linket, fx productdetails.html?id=1535.
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const statusMessage = document.querySelector("#status");
const retryButton = document.querySelector("#retry");
const productCard = document.querySelector("#product");

const colours = {
  "Silver-Black": "sølvfarvet og sort",
  "Blue-Black": "blå og sort",
  "Navy Blue": "mørkeblå",
  "Marine Blue": "mørkeblå",
  Black: "sort",
  Blue: "blå",
  Red: "rød",
  Orange: "orange",
  Green: "grøn",
  Pink: "pink",
  Grey: "grå",
  Purple: "lilla",
  Beige: "beige",
  Brown: "brun",
};
const types = {
  Backpacks: "rygsæk",
  Caps: "kasket",
  "Water Bottle": "drikkedunk",
  Handbags: "taske",
};
const materials = {
  polyester: "polyester",
  nylon: "nylon",
  polyamide: "polyamid",
  silicone: "silikone",
  cotton: "bomuld",
};

retryButton.addEventListener("click", getProduct);
getProduct();

// Henter ét produkt ud fra id'et i adressen.
async function getProduct() {
  // Hvis der mangler et gyldigt id, kan siden ikke vide, hvilket produkt den skal vise.
  if (!id || !/^\d+$/.test(id)) {
    statusMessage.textContent = "Vælg et produkt fra produktlisten.";
    return;
  }

  productCard.hidden = true;
  retryButton.hidden = true;
  statusMessage.textContent = "Henter produkt …";

  try {
    // API'et giver oplysningerne om det valgte produkt.
    const response = await fetch("https://kea-alt-del.dk/t7/api/products/" + id, {
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error("Produktet kunne ikke hentes: " + response.status);
    }

    const product = await response.json();
    if (!product.id || !product.productdisplayname) {
      throw new Error("Ugyldigt produkt");
    }

    showProduct(product);
    statusMessage.textContent = "";
    productCard.hidden = false;
  } catch (error) {
    statusMessage.textContent = "Produktet kunne ikke hentes. Prøv igen.";
    retryButton.hidden = false;
    console.error(error);
  }
}

// Sætter oplysningerne ind i de tomme felter i HTML'en.
function showProduct(product) {
  const name = product.productdisplayname.toLowerCase();
  const colourKey = Object.keys(colours).find((key) => name.includes(key.toLowerCase())) || product.basecolour;
  const colour = colours[colourKey] || product.basecolour || "";
  const type = name.includes("swimming cap") ? "badehætte" : types[product.articletype] || product.articletype || "produkt";

  document.title = product.productdisplayname + " | Jennifers sportsbutik";
  document.querySelector("#brand").textContent = product.brandname || "";
  document.querySelector("#product-name").textContent = product.productdisplayname;
  document.querySelector("#price").textContent =
    "Pris: " + Number(product.price).toLocaleString("da-DK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  document.querySelector("#type").textContent = type;
  document.querySelector("#colour").textContent = colour ? colour[0].toUpperCase() + colour.slice(1) : "–";
  document.querySelector("#gender").textContent = { Men: "Herre", Women: "Dame" }[product.gender] || product.gender || "–";
  document.querySelector("#product-id").textContent = product.id;

  // Kun farve, type og eventuelt et materiale, der faktisk står i API'et.
  const materialText = ((product.materialcaredesc || "") + " " + (product.description || "")).toLowerCase();
  const foundMaterials = Object.keys(materials)
    .filter((key) => materialText.includes(key))
    .map((key) => materials[key]);
  const shortText = [colour, type].filter(Boolean).join(" ");
  const material = foundMaterials.length ? " · " + foundMaterials.slice(0, 2).join(" og ") : "";
  document.querySelector("#description").textContent = shortText[0].toUpperCase() + shortText.slice(1) + material;
  document.querySelector("#description-section").hidden = false;

  const image = document.querySelector("#product-image");
  const fallback = document.querySelector("#image-fallback");
  image.hidden = false;
  fallback.hidden = true;
  image.alt = product.productdisplayname;
  // Hvis billedet mangler, vises en kort besked i stedet.
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  image.src = "https://kea-alt-del.dk/t7/images/webp/640/" + product.id + ".webp";
}
