function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const searchAndFilter = async (req, res) => {
  const queryKeys = Object.keys(req.query);
// initialize an empty array to store our db queries (objects) in
    const dbQueries = [];
 
   // destructure all potential properties from req.query
    let {
      search,
      priceMax,
      priceMin,
      name,
      category,
      avRating
     } = req.query;

    // check if search exists, if it does then we know that the user
    // submitted the search/filter form with a search query
    if (search) {
      // convert search to a regular expression and
      // escape any special characters
      search = new RegExp(escapeRegExp(search), "gi");
      // create a db query object and push it into the dbQueries array
      // now the database will know to search the name, amount, and category
      // fields, using the search regular expression
      dbQueries.push({
         $or: [
          { name: search },
          { category: search },
          { brand: search },
         ]
       
      });
    }
    if (name) {
      //filter(name);
      dbQueries.push({name: name }   );
    }
    if (category) {
      //filter(name);
      dbQueries.push({category: category }   );
    }
    if (avRating) {
			// create a db query object that finds any post documents where the avgRating
			// value is included in the avgRating array (e.g., [0, 1, 2, 3, 4, 5])
			dbQueries.push({ rating: { $in: avgRating } });
		}
      /*
				check individual min/max values and create a db query object for each
				then push the object into the dbQueries array
				min will search for all product documents with price
				greater than or equal to ($gte) the min value
				max will search for all product documents with price
				less than or equal to ($lte) the min value
			*/
      if (priceMin) dbQueries.push({price: { $gte: priceMax }});
       if (priceMax) dbQueries.push({price: { $lte: priceMax }});
   
   
 // const delimiter = queryKeys.length ? "&" : "?";
  return dbQueries.length ? { $and: dbQueries } : {};
 };
