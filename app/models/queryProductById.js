const queryProductById = async (productId, graphql) => {
  const response = await graphql(
    `
      query productInfo($id: ID!) {
        product(id: $id) {
          title
          description
          descriptionHtml
          metafield(namespace: "custom", key: "app_badges") {
            value
          }
          media(first: 3) {
            nodes {
              id
              alt
              mediaContentType
            }
          }
        }
      }
    `,
    {
      variables: {
        id: `gid://shopify/Product/${productId}`,
      },
    },
  );

  const { data } = await response.json();

  console.log("productResult: ", data);

  // return {
  //   ...product,
  //   productDeleted: !productResult?.title,
  //   productTitle: productResult?.title,
  //   productImage: productResult?.images?.nodes[0]?.url,
  //   productAlt: productResult?.images?.nodes[0]?.altText,
  //   productDescription: productResult?.productDescription,
  // };
};

export default queryProductById;
