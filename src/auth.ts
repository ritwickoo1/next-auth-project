import NextAuth, { CredentialsSignin } from "next-auth";
import GoogleProvide from "next-auth/providers/google";
import CredentialProvider from "next-auth/providers/credentials";
import { User } from "./models/userModel";
import { compare } from "bcryptjs"
import { connectToDatabase } from "./lib/utils";
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GoogleProvide({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },
            authorize: async (credentials) => {
                const email = credentials.email as string | undefined;
                const password = credentials.password as string | undefined;
                if (!email || !password)
                    throw new CredentialsSignin("Please provide both email and password");

                await connectToDatabase();

                const user = await User.findOne({ email }).select("+password");

                if (!user) {
                    throw new CredentialsSignin("Invalid email or password");
                }

                if (!user.password) {
                    // use cause to send a message to the client
                    throw new CredentialsSignin("Invalid email or password"); 
                }
                const isMatch = await compare(password, user.password);
                if (!isMatch) {
                    // use cause to send a message to the client
                    throw new CredentialsSignin("Invalid email or password");
                }
                return { name: user.name, email: user.email, id: user._id };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
});
