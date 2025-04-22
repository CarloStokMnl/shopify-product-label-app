import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import queryProductById from "../models/queryProductById";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const productId = params?.id;
  console.log("productId: ", productId);

  if (productId) {
    const response = await queryProductById(productId, admin.graphql);
    // const {
    //   data: { product },
    // } = await response.json();

    // console.log(product);
  }

  return admin;
};

export default function ProductPage() {
  return <Page></Page>;
}
