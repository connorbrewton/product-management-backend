const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

const pool = new Pool({
  user: 'connor',
  host: 'localhost',
  database: 'test_db',
  password: 'testpassword',
  port: 5432, // Default PostgreSQL port
});

app.use(cors(corsOptions));

app.use(express.json());

// Create a new product
app.post('/api/products', async (req, res) => {
  const { name, upc, availableOn, properties } = req.body;
  const client = await pool.connect();

  // Ensure that properties is an array and limit it to a maximum of 10 elements
  const validatedProperties = Array.isArray(properties) ? properties.slice(0, 10) : [];

  try {
    await client.query('BEGIN'); // Start a transaction

    // Insert a record into the product table
    const productResult = await client.query(
      'INSERT INTO product (name, upc, available_on) VALUES ($1, $2, $3) RETURNING id',
      [name, upc, availableOn]
    );

    const productID = productResult.rows[0].id;

    // Loop through the properties and insert records into property and product_properties tables
    for (const propertyData of validatedProperties) {
      const propertyName = propertyData.propertyName;
      const propertyValue = propertyData.propertyValue;

      // Insert a record into the property table, or use an existing record if the name matches
      const propertyQuery = `
        INSERT INTO property (name) VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        RETURNING id;
      `;

      const propertyResult = await client.query(propertyQuery, [propertyName]);

      let propertyID = propertyResult.rows[0]?.id;

      // If a new property was inserted, get the property ID
      if (!propertyID) {
        const existingPropertyQuery = 'SELECT id FROM property WHERE name = $1 LIMIT 1';
        const existingPropertyResult = await client.query(existingPropertyQuery, [propertyName]);

        if (existingPropertyResult.rows.length > 0) {
          propertyID = existingPropertyResult.rows[0].id;
        }
      }

      // Insert a record into the product_properties table with references to property and product
      await client.query(
        'INSERT INTO product_properties (value, property_id, product_id) VALUES ($1, $2, $3)',
        [propertyValue, propertyID, productID]
      );
    }

    await client.query('COMMIT'); // Commit the transaction

    res.status(201).json({ message: 'Product and properties created successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the product and properties.' });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

// Retrieve all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        product.name,
        product.upc,
        TO_CHAR(product.available_on, 'MM/DD/YYYY') AS availableon,
        json_agg(json_build_object('propertyName', property.name, 'propertyValue', product_properties.value)) AS properties
      FROM product
      LEFT JOIN product_properties ON product.id = product_properties.product_id
      LEFT JOIN property ON product_properties.property_id = property.id
      GROUP BY product.id
    `);

    res.json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
});


// Update a products by ID
app.put('/api/products/:id', async (req, res) => {
  const taskId = req.params.id;
  const { title, completed } = req.body;

  try {
    const result = await pool.query(
      'UPDATE products SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
      [title, completed, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the task.' });
  }
});

// Delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
  const taskId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Products deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the task.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
