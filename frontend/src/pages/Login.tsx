import React, { useState } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { TextInput } from "../components/TextInput";

export default function Login() {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Usuario:", name);
  };

  return (
    <div className="w-full flex flex-row">
        <div className="min-h-screen flex items-center justify-center px-4">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6"
        >
            <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">DOMUS</h1>
            <p className="text-gray-500 mt-2">
                Inicia sesión en tu sistema comunitario
            </p>
            </div>

            <Field label="Nombre de usuario" htmlFor="name">
            <TextInput
                id="name"
                placeholder="Ingresa tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            </Field>

            <Button type="submit">Ingresar</Button>
        </form>
        </div>
        <div className="w-1/2 h-full">   
            <img src="fondo_hex.png" alt="" />
        </div>
    </div>
  );
}