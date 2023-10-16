# product-management-backend
Node.js backend for product management app. Connects to Postgres database.

This project uses a React frontend which connects to this Node.js backend and a Postgres database. To run this project, you will need to setup the Postgres database.

Note: This project was developed on a M1 Mac with the following installed:
VSCode,
React 18.1.0,
Node 18.3.0,
npm 8.11.0

By default, the react frontend should be using port 3000, the node.js backend should be using port 5000, and the postgres database should be at port 5432.

-------------------------------------------------------------------------------
SETUP POSTGRES DATABASE
-------------------------------------------------------------------------------
Go to the Postgres website here (https://postgresapp.com/) and download postgres.
Follow the instructions on the introduction tab.

After following the instructions, use the PostgreSQL command line to create the database.
Open a terminal, and use the following commands:

    sudo -i -u postgres

    psql

The psql command opens the PostgreSQL shell. You can exit by typing \q.

Inside the PostgreSQL shell, create a new database with the command:

    CREATE DATABASE test_db;

Create a new user by typing:

    CREATE USER connor WITH PASSWORD 'testpassword';

This username, password and database name (test_db) are used in the node.js backend to connect to the database. (See file server.js, line 20)
Grant the user access to the database. In the PostgreSQL shell, type:

    GRANT ALL PRIVILEGES ON DATABASE test_db TO connor;

Next, connect to the test_db:

    \c test_db

Next, run this command:

    GRANT ALL ON SCHEMA public TO connor; 

Now exit by typing \q

Now you can create the 3 tables needed to run this project. To connect to the test_db database using psql, run this command:

    psql -U connor -d test_db

Now create the product table:

    CREATE TABLE product (
        id serial PRIMARY KEY,
        name VARCHAR(1024) UNIQUE NOT NULL,
        upc VARCHAR(13) CHECK (upc ~ '^[0-9]+$' AND LENGTH(upc) IN (10, 12, 13)) UNIQUE NOT NULL,
        available_on TIMESTAMP WITH TIME ZONE CHECK (available_on > NOW())
    );


Now create the property table:

    CREATE TABLE property (
        id serial PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
    );


Now create the product_properties table:

    CREATE TABLE product_properties (
        id serial PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        property_id INT REFERENCES property(id),
        product_id INT REFERENCES product(id)
    );


In the PostgreSQL shell, you can do a few things to check the tables or delete records:
To see all tables in the current database:

    \dt

To view the structure of the product table:

    \d product

To view records in the product table:

    SELECT * FROM product;

To delete records from the product table:

    DELETE FROM product;

Replace product with any of the table names to view/delete that table.

Now the Postgres database should be setup to run this project!

-------------------------------------------------------------------------------
CLONE AND SETUP THE PROJECT
-------------------------------------------------------------------------------
Open a terminal and create a directory where you want this project to be located and navigate into it.

    mkdir product-management
    cd product-management

You will clone both the frontend and backend projects from github into this directory.

-------------------------------------------------------------------------------
FRONTEND
-------------------------------------------------------------------------------
First, clone the frontend by typing the following while in the product-management directory.

    git clone https://github.com/connorbrewton/product-management-frontend.git

There should be a new directory called product-management-frontend. Checkout the master branch:

    git checkout master

Now you should see the project files in this directory. Next, install the dependencies with these commands:

    cd product-management-frontend
    rm -rf package-lock.json
    npm install

After the dependencies are installed, you should be able to start the frontend by typing:

    npm start

But first, let's clone the backend.

-------------------------------------------------------------------------------
BACKEND
-------------------------------------------------------------------------------
If you are still in the frontend directory, nav back to the product-management directory:

    cd ..

Now clone the backend:

    git clone https://github.com/connorbrewton/product-management-backend.git

There should be a new directory called product-management-backend. Checkout the master branch:

    git checkout master

Now you can start the backend by typing the command:

    node server.js
    
-------------------------------------------------------------------------------
RUN THE WHOLE PROJECT
-------------------------------------------------------------------------------
Now you are ready to run the whole project! 
Make sure that in the Postgres Application, it says 'Running'. If it says 'Not running', click the 'Start' button. You should see your 'test_db' database in this window.

Open two terminal windows. 
In the first terminal, navigate to the product-management-backend directory and run:

    node server.js

In the second terminal, navigate to the product-management-frontend directory and run:

    npm start

A browser window should open up showing the Create Products page. You can create products here and save them with the save button. You can also click the 'Go to Products' button to see a list of all created products and use the search field to filter the products by product name.
