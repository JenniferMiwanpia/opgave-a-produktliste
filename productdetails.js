// Produktlisten sender id'et med i linket, fx productdetails.html?id=1535.
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const statusMessage = document.querySelector("#status");
const retryButton = document.querySelector("#retry");
const productCard = document.querySelector("#product");

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
  document.title = product.productdisplayname + " | Jennifers sportsbutik";
  document.querySelector("#brand").textContent = product.brandname || "";
  document.querySelector("#product-name").textContent = product.productdisplayname;
  document.querySelector("#price").textContent =
    "Pris: " + Number(product.price).toLocaleString("da-DK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  document.querySelector("#type").textContent = product.articletype || "–";
  document.querySelector("#colour").textContent = product.basecolour || "–";
  document.querySelector("#gender").textContent = product.gender || "–";
  document.querySelector("#product-id").textContent = product.id;

  // Beskrivelsen fra API'et kan indeholde HTML; her tager jeg kun teksten.
  const description = new DOMParser()
    .parseFromString(product.description || "", "text/html")
    .body.textContent.trim();
  document.querySelector("#description").textContent = description;
  document.querySelector("#description-section").hidden = !description;

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
