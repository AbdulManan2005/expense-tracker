Expense Tracker 

A full-stack web application for tracking income and expenses, viewing financial summaries, and visualizing spending with charts. Users register, log in, and manage their own private financial records.

🔗 Live Demo

(Add your deployed link here)

Features
User authentication – register and log in with JWT-based sessions; passwords are hashed with bcrypt
Income and expense management – add, edit, and delete transactions
Filtering – filter transactions by type and date range
Financial summary – total income, total expenses, and balance
Data visualization – expenses-by-category doughnut chart and monthly income vs. expenses bar chart
Private data – every user can only see and modify their own transactions
Responsive dashboard – works on desktop and mobile screens

Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, vanilla JavaScript, Chart.js
Backend	Node.js, Express
Database	PostgreSQL
Authentication	JSON Web Tokens (jsonwebtoken), bcryptjs
Other	pg, cors, dotenv, nodemon (dev)
📁 Project Structure
expense-tracker/
├── config/
│   └── db.js              # PostgreSQL connection pool
├── middleware/
│   └── auth.js            # JWT verification middleware
├── routes/
│   ├── auth.js            # Register, login, current user
│   ├── transactions.js    # Transactions CRUD
│   └── reports.js         # Summary, by-category, monthly reports
├── public/
│   ├── index.html         # Login / register page
│   ├── dashboard.html     # Dashboard page
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js         # Shared API and session helpers
│       ├── auth.js        # Login / register logic
│       └── dashboard.js   # Dashboard, transactions, and charts
├── server.js              # Express app entry point
├── .env.example           # Environment variable template
├── .gitignore
└── package.json


Create a PostgreSQL database (for example expense_tracker) and run the following SQL in it:

sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
4. Configure environment variables

Copy .env.example to a new file named .env and fill in your values:

env
DB_NAME=expense_tracker
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
PORT=5000
JWT_SECRET=a_long_random_secret_string

The .env file is listed in .gitignore and must never be committed.

5. Run the app
bash
npm run dev

Open http://localhost:5000 in your browser, register an account, and log in.

🔌 API Reference

All /api/transactions and /api/reports routes require the header Authorization: Bearer <token>.

Authentication
Method	Endpoint	Description
POST	/api/auth/register	Create a new account
POST	/api/auth/login	Log in and receive a JWT
GET	/api/auth/me	Get the logged-in user

Transactions
Method	Endpoint	Description
POST	/api/transactions	Create a transaction
GET	/api/transactions	List transactions (optional filters: type, category, from, to)
PUT	/api/transactions/:id	Update a transaction
DELETE	/api/transactions/:id	Delete a transaction
Reports
Method	Endpoint	Description
GET	/api/reports/summary	Total income, total expenses, and balance (optional from, to)
GET	/api/reports/by-category	Totals grouped by category (optional type, from, to)
GET	/api/reports/monthly	Income and expenses per month (optional year)
Utility
Method	Endpoint	Description
GET	/api/health	Checks that the server and database are running

🔒 Security Notes
Passwords are hashed with bcrypt and never stored in plain text
Protected routes verify a JWT on every request
All transaction queries are scoped to the logged-in user's id
Database queries use parameterized statements to prevent SQL injection
Secrets live in .env, which is excluded from version control

Notes

Built as an internship project to practice full-stack development, authentication, database operations, and data visualization.

Author

Abdul Manan

License

This project is open source and free to use for learning purposes.