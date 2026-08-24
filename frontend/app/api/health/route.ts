export async function GET() {
  return Response.json({
    status: "healthy",
    message: "Recovery Engine is online and ready.",
  });
}