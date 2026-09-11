export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { licenseKey } = req.body;
  if (!licenseKey || typeof licenseKey !== "string") {
    return res.status(400).json({ valid: false, error: "Missing license key" });
  }

  const PRODUCT_ID = "gJcl5PeDJkdtmokB9zbyfg=="; // Gumroad Product ID (required for products created after Jan 9, 2023)

  try {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_id: PRODUCT_ID,
        license_key: licenseKey.trim(),
        increment_uses_count: "false", // checking status shouldn't burn a "use"
      }),
    });

    const data = await response.json();

    // Gumroad returns success:false if the key doesn't exist / doesn't match the product
    if (!data.success) {
      return res.status(200).json({ valid: false, reason: "not_found" });
    }

    const purchase = data.purchase || {};

    // A key can exist but no longer correspond to an active paying subscriber
    if (purchase.refunded || purchase.chargebacked) {
      return res.status(200).json({ valid: false, reason: "refunded" });
    }
    if (purchase.subscription_cancelled_at || purchase.subscription_ended_at || purchase.subscription_failed_at) {
      return res.status(200).json({ valid: false, reason: "subscription_inactive" });
    }

    return res.status(200).json({ valid: true, email: purchase.email || null });
  } catch (e) {
    return res.status(500).json({ valid: false, error: "Verification failed", message: e.message });
  }
}
