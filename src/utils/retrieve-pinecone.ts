async function retrieveFromPinecone(query: string) {
  console.log("Starting Pinecone retrieval...");
  const startTime = Date.now();
  let response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
  } catch (error) {
    console.error("Fetch error in retrieveFromPinecone:", error);
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve data from Pinecone: ${response.statusText}`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Error parsing Pinecone response JSON:", error);
    throw error;
  }

  let res = "";
  if (data.results.length > 0) {
    res = data.results
      .slice(0, 3)
      .map((item: any) => `[Relevansi: ${item.score.toFixed(2)}] ${item.text}`)
      .join("\n\n---\n\n");
  } else {
    res = "Tidak ada data yang relevan ditemukan.";
  }
  const endTime = Date.now();
  console.log(`Pinecone retrieval finished in ${endTime - startTime}ms`);
  return res;
}

export default retrieveFromPinecone;
