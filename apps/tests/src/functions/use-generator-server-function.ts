export async function* sayHello() {
    "use server";
    yield "Hello, World!";
    yield "¡Hola, Mundo!";
}