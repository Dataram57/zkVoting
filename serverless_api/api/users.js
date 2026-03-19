let users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];

export default function handler(req, res) {
    switch (req.method) {
        case "GET":
            return res.status(200).json(users);

        case "POST":
            const newUser = {
                id: Date.now(),
                name: req.body.name
            };
            users.push(newUser);
            return res.status(201).json(newUser);

        default:
            return res.status(405).end();
    }
}