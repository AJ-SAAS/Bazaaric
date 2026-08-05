"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth, db } from "@/lib/firebase";

import { doc, setDoc } from "firebase/firestore";


export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("signup");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");


    try {

      if (mode === "signup") {

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        const user = userCredential.user;


        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email,
          createdAt: new Date(),
        });


        setMessage("Account created successfully!");

      } else {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        setMessage("Logged in successfully!");

      }


    } catch (error: any) {

      setMessage(error.message);

    } finally {

      setLoading(false);

    }
  }



  return (
    <div className="w-full max-w-md mx-auto mt-20">

      <div className="flex gap-4 mb-6">

        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg p-3 ${
            mode === "login"
              ? "bg-black text-white"
              : "bg-gray-100"
          }`}
        >
          Login
        </button>


        <button
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg p-3 ${
            mode === "signup"
              ? "bg-black text-white"
              : "bg-gray-100"
          }`}
        >
          Sign Up
        </button>

      </div>



      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >


        {mode === "signup" && (

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

        )}



        <input
          className="w-full border rounded-lg p-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />



        <input
          className="w-full border rounded-lg p-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />



        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg p-3"
        >

          {loading
            ? "Please wait..."
            : mode === "signup"
            ? "Create account"
            : "Login"}

        </button>


      </form>



      {message && (

        <p className="mt-5 text-sm">
          {message}
        </p>

      )}


    </div>
  );
}