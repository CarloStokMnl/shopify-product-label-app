import { useEffect, useState } from "react";
import {
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Select,
  Button,
  Banner,
  Spinner,
  Form,
  FormLayout,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

const badgeOptions = [
  { label: "New Arrival", value: "new" },
  { label: "Best Seller", value: "bestseller" },
  { label: "Limited Stock", value: "limited" },
];

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  //Get the Products
  const query = `
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);

  const {
    data: { products },
  } = await response.json();

  return products?.edges?.map((edge) => edge?.node);
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const rawData = formData?.get("data"); // Get the stringified object
  const data = JSON.parse(rawData); // Parse it back to an object
  const productId = data?.productId;
  const badge = data?.badge;

  if (!productId || !badge) {
    return {
      status: 200,
      type: "critical",
      message: "Missing product ID or badge",
    };
  }

  const mutation = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

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

  const response = await admin.graphql(mutation, { variables: variables });

  console.log("response api: ", response);

  // if (response.data.metafieldsSet.userErrors.length > 0) {
  //   return new Response(
  //     JSON.stringify({
  //       error: response.data.metafieldsSet.userErrors[0].message,
  //     }),
  //     { status: 400, headers: { "Content-Type": "application/json" } },
  //   );
  // }

  return {
    status: 200,
    type: "success",
    message: "Badge saved to Product successfully",
  };
};

export default function Index() {
  const products = useLoaderData(); // Remix Hook to get the data from the loader
  const submit = useSubmit(); // Remix Hook to programmatically submit the form
  const actionData = useActionData(); // Remix Hook to use the data return from the action
  const navigation = useNavigation(); // Remix Hook to identify the state of navigation or submission
  const shopify = useAppBridge();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const isFormSubmitting = navigation.state === "submitting";

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent Default of the Form
    const formData = new FormData(); // get the data from the Form using the New FormData API

    const data = {
      productId: selectedProduct,
      badge: selectedBadge,
    };

    formData.set("data", JSON.stringify(data)); // Stringify the object
    submit(formData, { method: "post" });
  };

  return (
    <Page title="Product Badges">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <Select
                  label="Select Product"
                  options={products?.map((p) => ({
                    label: p.title,
                    value: p.id,
                  }))}
                  onChange={setSelectedProduct}
                  value={selectedProduct}
                />
                <Select
                  label="Select Badge"
                  options={badgeOptions}
                  onChange={setSelectedBadge}
                  value={selectedBadge}
                />
                <Button primary submit disabled={isFormSubmitting}>
                  {isFormSubmitting ? <Spinner size="small" /> : "Save"}
                </Button>
              </FormLayout>
            </Form>
            {actionData?.message && (
              <Banner
                title={actionData?.message}
                status={actionData?.type === "success" ? "success" : "critical"}
              />
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
