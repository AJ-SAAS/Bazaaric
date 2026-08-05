import AuthForm from "@/components/auth/AuthForm";


export default function AuthPage() {

  return (

    <main className="min-h-screen p-6">

      <h1 className="text-3xl font-bold text-center">
        Welcome to Bazaaric
      </h1>


      <p className="text-center text-gray-500 mt-2">
        Buy and sell across the Baltics
      </p>


      <AuthForm />

    </main>

  );

}