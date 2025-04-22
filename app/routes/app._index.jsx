import { useEffect, useState } from "react";
import { redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  Link,
} from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  Button,
  Banner,
  Spinner,
  Form,
  FormLayout,
  ChoiceList,
  MediaCard,
  Card,
  InlineStack,
  Text,
  Thumbnail,
  ButtonGroup,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import queryProductById from "../models/queryProductById";

/* TODO

  Better to change to select from window.shopify a product 
  show it as button
  edit it as a link
  use the product.id route
  get the id from loader param
  load all the info from product
  then edit from there
*/

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
            description
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

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData(); // get the form data that was passed from submit()
  const rawData = formData?.get("data"); // Get the stringified object
  const data = JSON.parse(rawData); // Parse it back to an object
  const { productId, multipleSelected } = data; // destructure data
  const stringMultiBadge = JSON.stringify(multipleSelected);

  if (!productId) {
    return {
      status: 200,
      type: "critical",
      message: "Missing product ID or badge",
    };
  }

  //Mutation to add the Metafield
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

  //Values to add
  const variables = {
    metafields: [
      {
        ownerId: productId,
        namespace: "custom",
        key: "app_badges",
        type: "list.single_line_text_field",
        value: stringMultiBadge,
      },
    ],
  };

  try {
    // await admin.graphql(mutation, { variables: variables });

    // return {
    //   status: 200,
    //   type: "success",
    //   message: "Badge saved to Product successfully",
    // };

    return redirect(`/app/product/${productId}`);
  } catch (response) {
    console.error("Error: ", response);

    return {
      status: 500,
      type: "critical",
      message: "Error occure while processing request. Please try again.",
    };
  }
};

export default function Index() {
  const products = useLoaderData(); // Remix Hook to get the data from the loader
  const submit = useSubmit(); // Remix Hook to programmatically submit the form
  const actionData = useActionData(); // Remix Hook to use the data return from the action
  const navigation = useNavigation(); // Remix Hook to identify the state of navigation or submission
  const shopify = useAppBridge();
  const [selectedProduct, setSelectedProduct] = useState();
  const [multipleSelected, setMultipleSelected] = useState([]);
  const [isSaveButtonDisable, SetIsSaveButtonDisable] = useState(true);
  const isFormSubmitting = navigation.state === "submitting"; // Set state if the form was submitting
  const [hideBannerMessage, setHideBannerMessage] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(actionData?.message);
  const [selectedProductId, setSelectedProductId] = useState("");
  const actionFormSuccess =
    actionData?.type === "success" ? "success" : "critical";

  const handleShopifyResourcePicker = async () => {
    const productPicked = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
    });

    if (productPicked) {
      // const queryProduct = await queryProductById(productPicked[0].id);
      // console.log("queryProduct: ", queryProduct);
      console.log(productPicked);
      const filteredId = productPicked[0]?.id?.split(
        "gid://shopify/Product/",
      )?.[1];

      setSelectedProductId(filteredId);
      setSelectedProduct(productPicked[0]);
      SetIsSaveButtonDisable(false);
    }
  };

  const handleMultipleSelect = (value) => {
    setMultipleSelected(value);
  };

  // Reset Mutiple Selected Badge, Selected Product and Disable Save Button
  const handleCancelSelection = () => {
    setMultipleSelected([]);
    setSelectedProduct();
    SetIsSaveButtonDisable(true);
  };

  const handleOnDismissBanner = () => {
    setBannerMessage(""); // Clear the Banner Message
    setHideBannerMessage(true); // Hide the Banner Bar
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent Default of the Form
    const formData = new FormData(); // get the data from the Form using the New FormData API

    const data = {
      productId: selectedProduct?.id,
      multipleSelected: multipleSelected,
    };

    //add the data to formdata
    formData.set("data", JSON.stringify(data)); // Stringify the object

    //Pass the formdata to submit hook
    submit(formData, { method: "post" });
  };

  // Reset Upon Success Mutiple Selected Badge, Selected Product and Disable Save Button
  useEffect(() => {
    if (actionFormSuccess) {
      setMultipleSelected([]);
      SetIsSaveButtonDisable(true);
      setSelectedProduct();
    }
  }, [actionFormSuccess]);

  //Re-render the UI when actionData was changed
  useEffect(() => {
    setBannerMessage(actionData?.message); // Update the Banner Message
    setHideBannerMessage(false); // Show the Banner Bar
  }, [actionData]); // Use ActionData as Dependency to force re-render

  return (
    <Page title="Product Badges">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {!selectedProduct && (
              <Button fullWidth onClick={handleShopifyResourcePicker}>
                Select Product
              </Button>
            )}

            {selectedProduct && (
              <>
                <Card roundedAbove="sm">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      {selectedProduct?.images?.[0]?.originalSrc && (
                        <Thumbnail
                          size="large"
                          source={selectedProduct?.images?.[0]?.originalSrc}
                          alt={selectedProduct?.title}
                        />
                      )}
                      {selectedProduct?.title && (
                        <Text as="h2" variant="headingSm">
                          {selectedProduct?.title}
                        </Text>
                      )}
                      {selectedProduct?.descriptionHtml &&
                        selectedProduct?.descriptionHtml}
                    </BlockStack>
                    <InlineStack>
                      <ButtonGroup>
                        <Link to={`product/${selectedProductId}`}>Add</Link>
                        <Button
                          variant="secondary"
                          tone="critical"
                          onClick={handleCancelSelection}
                          accessibilityLabel="Cancel shipment"
                        >
                          Cancel
                        </Button>
                      </ButtonGroup>
                    </InlineStack>
                  </BlockStack>
                </Card>
                <Form onSubmit={handleSubmit}>
                  <FormLayout>
                    <ChoiceList
                      title="Select Options"
                      choices={badgeOptions}
                      selected={multipleSelected}
                      onChange={handleMultipleSelect}
                      allowMultiple
                      name="multipleSelect"
                    />
                    <Button primary submit disabled={isSaveButtonDisable}>
                      {isFormSubmitting ? <Spinner size="small" /> : "Save"}
                    </Button>
                  </FormLayout>
                </Form>
              </>
            )}

            {bannerMessage && !hideBannerMessage && (
              <Banner
                hideIcon={false}
                onDismiss={handleOnDismissBanner}
                title={bannerMessage}
                tone={actionFormSuccess}
              />
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
