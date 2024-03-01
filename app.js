const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Client } = require('cassandra-driver');

const app = express();
const port = 3000;

// Connect to Cassandra
const client = new Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'project' // Specify the keyspace
});

// Connect to Cassandra
client.connect()
  .then(() => console.log('Connected to Cassandra'))
  .catch(err => console.error('Error connecting to Cassandra', err));

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// Serve HTML form
app.get('/', (req, res) => {
  res.render('signup');
});
app.get('/login', (req,res)=>{
    res.render('login');
})

// Handle form submission and insert data into Cassandra
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Insert data into Cassandra
    await client.execute('INSERT INTO project.form (username, password) VALUES (?, ?)', [username, password]);
    res.status(200).send("Signup Successfull....\n<a href='/login'>Login Now</a>");
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async(req,res)=>{
    const { username,password } = req.body;

    try{
        const query = 'SELECT * FROM project.form WHERE username = ?';
        client.execute(query, [username], { prepare: true }, function(err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                if (result.rows.length === 0) {
                    res.status(401).send('User not found');
                } else {
                    const user = result.rows[0];
                    if (user.password === password) {
                    res.status(200).send('Login successful');
                    } else {
                    res.status(401).send('Incorrect password');
                    }
                }   
            }
        });
    }catch(e){
        console.log(e);
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});