import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import axios from "axios";
import "./styles.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
const categories = ["base", "sauce", "cheese", "vegetable"];

function Header() {
  return (
    <header className="nav">
      <Link className="brand" to="/">
        <b>●</b> PizzaFlow
      </Link>
      <nav>
        <Link to="/">Menu</Link>
        <Link to="/build">Build a pizza</Link>
        <Link to="/dashboard">My orders</Link>
        <Link className="nav-order" to="/build">
          Start an order
        </Link>
      </nav>
    </header>
  );
}
function Home() {
  const [pizzas, setPizzas] = useState([]);
  useEffect(() => {
    api
      .get("/pizzas")
      .then(({ data }) => setPizzas(data))
      .catch(() => setPizzas([]));
  }, []);
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Hot, fresh, yours</p>
          <h1>
            Pizza made for <em>your</em> kind of hungry.
          </h1>
          <p>
            Classic favourites or a perfectly personal creation, ready for your
            next good moment.
          </p>
          <Link className="button" to="/build">
            Build your pizza
          </Link>
        </div>
        <div className="pizza-art">
          <div className="pizza-disc">🍕</div>
          <span>Fresh from the oven</span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The menu</p>
            <h2>Made to be a favourite.</h2>
          </div>
          <Link to="/build">Customise your own</Link>
        </div>
        <div className="pizza-grid">
          {pizzas.length ? (
            pizzas.map((pizza) => (
              <article className="pizza-card" key={pizza._id}>
                <div className="pizza-photo">🍕</div>
                <p className="card-tag">{pizza.category}</p>
                <h3>{pizza.name}</h3>
                <p>{pizza.description}</p>
                <div>
                  <b>₹{(pizza.priceMinor / 100).toFixed(2)}</b>
                  <Link to="/build">Choose</Link>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-copy">
              Menu items will appear after you run the seed script.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
function Builder() {
  const [ingredients, setIngredients] = useState([]);
  const [selection, setSelection] = useState({
    base: "",
    sauce: "",
    cheese: "",
    vegetables: [],
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    api
      .get("/ingredients")
      .then(({ data }) => setIngredients(data))
      .catch(() =>
        setMessage("Start the API and seed the database to load ingredients."),
      );
  }, []);
  const grouped = useMemo(
    () =>
      categories.reduce(
        (result, category) => ({
          ...result,
          [category]: ingredients.filter((item) => item.category === category),
        }),
        {},
      ),
    [ingredients],
  );
  const toggleVegetable = (name) =>
    setSelection((current) => ({
      ...current,
      vegetables: current.vegetables.includes(name)
        ? current.vegetables.filter((item) => item !== name)
        : [...current.vegetables, name],
    }));
  const total = ingredients
    .filter((item) =>
      [
        selection.base,
        selection.sauce,
        selection.cheese,
        ...selection.vegetables,
      ].includes(item.name),
    )
    .reduce((sum, item) => sum + item.priceMinor, 49900);
  return (
    <section className="builder section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Create your own</p>
          <h1>Build it your way.</h1>
        </div>
        <aside>
          <b>₹{(total / 100).toFixed(2)}</b>
          <span>starting with fresh dough</span>
        </aside>
      </div>
      {categories.map((category, index) => (
        <fieldset key={category}>
          <legend>
            <span>{index + 1}</span> Choose your{" "}
            {category === "cheese"
              ? "cheese"
              : category === "vegetable"
                ? "vegetables"
                : category}
          </legend>
          <div className="choice-grid">
            {grouped[category]?.map((item) => {
              const active =
                category === "vegetable"
                  ? selection.vegetables.includes(item.name)
                  : selection[category] === item.name;
              return (
                <button
                  className={active ? "choice active" : "choice"}
                  type="button"
                  key={item._id}
                  onClick={() =>
                    category === "vegetable"
                      ? toggleVegetable(item.name)
                      : setSelection({ ...selection, [category]: item.name })
                  }
                >
                  <b>{item.name}</b>
                  <small>+ ₹{(item.priceMinor / 100).toFixed(2)}</small>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="builder-footer">
        <p>
          {message ||
            "Choose one base, sauce, cheese, and any vegetables you like."}
        </p>
        <button
          className="button"
          type="button"
          onClick={() =>
            setMessage(
              "Order summary and Razorpay checkout are connected in Phase 2 after test keys are added.",
            )
          }
        >
          Continue to summary
        </button>
      </div>
    </section>
  );
}
function Account({ register = false }) {
  const [notice, setNotice] = useState("");
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data } = await api.post(
        register ? "/auth/register" : "/auth/login",
        values,
      );
      setNotice(data.message || "Success.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to continue.");
    }
  }
  return (
    <section className="account">
      <div className="account-copy">
        <p className="eyebrow">PizzaFlow account</p>
        <h1>{register ? "Good pizza starts here." : "Welcome back."}</h1>
        <p>Save your favourites and track every order from oven to doorstep.</p>
      </div>
      <form onSubmit={submit}>
        <p className="eyebrow">{register ? "Create account" : "Sign in"}</p>
        {register && (
          <label>
            Name
            <input name="name" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="8" required />
        </label>
        <button className="button">
          {register ? "Create account" : "Sign in"}
        </button>
        <p className="form-note">{notice}</p>
        <p>
          {register ? "Already have an account?" : "New here?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create account"}
          </Link>
        </p>
      </form>
    </section>
  );
}
function Dashboard() {
  return (
    <section className="section dashboard">
      <p className="eyebrow">Your dashboard</p>
      <h1>Your orders, at a glance.</h1>
      <div className="status-card">
        <span>●</span>
        <div>
          <h3>Sign in to see live order updates.</h3>
          <p>
            Order status will refresh automatically while an order is active.
          </p>
        </div>
      </div>
    </section>
  );
}
function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/build" element={<Builder />} />
          <Route path="/login" element={<Account />} />
          <Route path="/register" element={<Account register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <footer>
        <b>PizzaFlow</b>
        <span>Freshly made, thoughtfully delivered.</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
