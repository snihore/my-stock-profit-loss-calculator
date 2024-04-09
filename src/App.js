import React from 'react';
import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const firebaseConfig = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_AUTH_DOMAIN",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_STORAGE_BUCKET",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID",
  // measurementId: "YOUR_MEASUREMENT_ID"

    apiKey: "AIzaSyAgR8VPLiTRAdyDF6SKeNQEpUvPNLi_zP0",
    authDomain: "stockplcalculator.firebaseapp.com",
    projectId: "stockplcalculator",
    storageBucket: "stockplcalculator.appspot.com",
    messagingSenderId: "694866338723",
    appId: "1:694866338723:web:be3301f26d916185c4b016"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

class CalculatePL {
  constructor(date, stockName, buyAt, sellAt, quantity) {
    this.date = date;
    this.stockName = stockName;
    this.buyAt = parseFloat(buyAt).toFixed(2);
    this.sellAt = parseFloat(sellAt).toFixed(2);
    this.quantity = parseFloat(quantity).toFixed(2);
    this.profileAndLoss = 0;
    this.profitAndLossPer = 0;
    this.CapitalRequired = 0;
  }

  calculate() {
    this.profileAndLoss = parseFloat((this.sellAt - this.buyAt) * this.quantity).toFixed(2);
    this.CapitalRequired = parseFloat(this.buyAt * this.quantity).toFixed(2);
    this.profitAndLossPer = parseFloat((this.profileAndLoss / this.CapitalRequired) * 100).toFixed(2);
  }

  saveToFirestore() {
    

    db.collection("results").add({
      date: this.date,
      stockName: this.stockName,
      buyAt: this.buyAt,
      sellAt: this.sellAt,
      quantity: this.quantity,
      profileAndLoss: this.profileAndLoss,
      profitAndLossPer: this.profitAndLossPer,
      CapitalRequired: this.CapitalRequired
    })
    .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
  }
}

function App() {
  const [results, setResults] = React.useState([]);
  const [date, setDate] = React.useState(null);
  const [stockName, setStockName] = React.useState('');
  const [buyAt, setBuyAt] = React.useState('');
  const [sellAt, setSellAt] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState('desc');

  React.useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await db.collection("results").get();
      const data = [];
      querySnapshot.forEach(doc => {
        const result = doc.data();
        data.push({
          date: result.date,
          stockName: result.stockName,
          buyAt: result.buyAt,
          sellAt: result.sellAt,
          quantity: result.quantity,
          profileAndLoss: result.profileAndLoss,
          profitAndLossPer: result.profitAndLossPer,
          CapitalRequired: result.CapitalRequired
        });
      });
      // Sort results based on date when fetched from Firestore
      const sortedData = sortOrder === 'asc' ? data.sort((a, b) => new Date(a.date) - new Date(b.date)) : data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setResults(sortedData);
    };
    fetchData();
  }, [sortOrder]); // Added sortOrder as a dependency to re-fetch data when sorting order changes


  const calculatePL = () => {
    const calc = new CalculatePL(date.toLocaleDateString(), stockName, parseFloat(buyAt), parseFloat(sellAt), parseFloat(quantity));
    calc.calculate();
    calc.saveToFirestore();
    // Add the new entry to the results array and sort in descending order
  const updatedResults = [...results, calc].sort((a, b) => new Date(b.date) - new Date(a.date));
  setResults(updatedResults);
  };

  const exportToExcel = () => {
    // Implement your export to Excel functionality here
  };

  const handleDateChange = date => {
    setDate(date);
  }

  // Function to toggle sorting order
  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
  }

  
   // Calculate total profile and loss
   const totalProfitLoss = results.reduce((total, result) => total + parseFloat(result.profileAndLoss), 0);

   // Define style for displaying total profit and loss
   const totalProfitLossStyle = {
     fontWeight: 'bold',
     color: totalProfitLoss >= 0 ? 'green' : 'red'
   };
 
   // Define style for label "Total P&L"
   const totalLabelStyle = {
     color: 'lightblack',
     fontWeight: 'normal'
   };

  return (
    <div id="calculator">
      <h2>Stock Profit/Loss Calculator</h2>
      <label htmlFor="date">Date:</label>
      {/* <input type="text" id="date" value={date} onChange={(e) => setDate(e.target.value)} /><br /> */}
      <DatePicker id="date" selected={date} onChange={handleDateChange} dateFormat="dd-MM-yyyy" autoComplete="off"/><br />
      <label htmlFor="stockName">Stock Name:</label>
      <input type="text" id="stockName" value={stockName} onChange={(e) => setStockName(e.target.value)} autoComplete="off"/><br />
      <label htmlFor="buyAt">Buy At:</label>
      <input type="text" id="buyAt" value={buyAt} onChange={(e) => setBuyAt(e.target.value)} autoComplete="off"/><br />
      <label htmlFor="sellAt">Sell At:</label>
      <input type="text" id="sellAt" value={sellAt} onChange={(e) => setSellAt(e.target.value)} autoComplete="off"/><br />
      <label htmlFor="quantity">Quantity:</label>
      <input type="text" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoComplete="off"/><br />
      <input type="button" value="Calculate" id="calculateButton" onClick={calculatePL} />
      <input type="button" value="Export to Excel" onClick={exportToExcel} /><br/>
      {/* Button to toggle sorting order */}
      <button onClick={toggleSortOrder}>Toggle Sort Order</button>
      <br /><br/>
          {/* Display total profit/loss near the toggle button with rupees symbol */}
      <div><label>Total P&L:</label><label style={totalProfitLossStyle}> ₹{totalProfitLoss}</label></div>
      
      <table id="resultTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Stock Name</th>
            <th>Buy At</th>
            <th>Sell At</th>
            <th>Quantity</th>
            <th>Capital Required</th>
            <th>Profile & Loss</th>
            <th>Profit & Loss(%)</th>
          </tr>
        </thead>
        <tbody id="resultBody">
          {results.map((result, index) => (
            <tr key={index}>
              <td>{result.date}</td>
              <td>{result.stockName}</td>
              <td>{result.buyAt}</td>
              <td>{result.sellAt}</td>
              <td>{result.quantity}</td>
              <td>{result.CapitalRequired}</td>
              <td>{result.profileAndLoss}</td>
              <td>{result.profitAndLossPer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
