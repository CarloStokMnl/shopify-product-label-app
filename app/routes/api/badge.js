import { Response } from "@remix-run/node";

export const action = async ({ request, context }) => {
  const { admin } = context;
  const { productId, badge } = await request.json();

  console.log(productId);
  console.log(badge);

  if (!productId || !badge) {
    return new Response(
      JSON.stringify({ error: "Missing product ID or badge" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    metafields: [
      {
        ownerId: productId,
        namespace: "custom",
        key: "badge",
        type: "single_line_text_field",
        value: badge,
      },
    ],
  };

  const response = await admin.graphql(mutation, variables);

  console.log("response api: ", response);

  if (response.data.metafieldsSet.userErrors.length > 0) {
    return new Response(
      JSON.stringify({
        error: response.data.metafieldsSet.userErrors[0].message,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: "Badge saved successfully!" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
