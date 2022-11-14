import { A } from "solid-start";
import { createServerAction$, redirect } from "solid-start/server";
import authController from "~/application/auth/auth_controller";

export default function Login() {
  const [_, { Form }] = createServerAction$(async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    await authController.login(email, password);
    return redirect("/");
  });

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <Form>
        <label for="username">Email:</label>
        <input
          type="text"
          name="email"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        <label for="username">Password:</label>
        <input
          type="password"
          name="password"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        <button
          type="submit"
          value="submit"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Login
        </button>
      </Form>
      <A href="/register">Go to Register</A>
    </main>
  );
}
