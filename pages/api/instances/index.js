 async function handler(req, res) {
 
    const data = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=6`);
    const articles = await data.json();
 
    res.status(200).json({
        message: "Data fetch",
        articles : articles
    });
}

export default handler;
