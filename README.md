# DB-Unity

Unified database operations made easy. Manage, control, and perform unified actions on multiple databases with a single interface.

## Features

- **Unified Interface**: Seamlessly interact with different databases like MySQL, PostgreSQL, SQLite, and MSSQL with one interface.
- **User Management**: Create, update, and list users across databases.

- **Permissions**: Grant and revoke user permissions on specific tables or entire databases.

- **Safety**: Parameterized queries to avoid SQL injection vulnerabilities.

## Installation

```bash
npm install db-unity
```

## Usage

### Initialize

```javascript
const DBUnity = require("db-unity");
const db = new DBUnity("mysql", connectionOptions);
```

### Create a User

```javascript
db.createUser("newUser", "securePassword");
```

### Grant Permissions

```javascript
db.grantPrivileges("newUser", "read", "myDatabase", "*");
```

### List Users

```javascript
const users = db.listUsers();
console.log(users);
```

... [Add more usage examples as needed]

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-new-feature`).
3. Commit your changes (`git commit -am 'Add my new feature'`).
4. Push to the branch (`git push origin feature/my-new-feature`).
5. Open a new pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

Remember to modify, add, or remove sections to better align with the specifics of `db-unity`. Including screenshots, detailed API documentation, and other relevant sections can make your readme even more helpful for users.
