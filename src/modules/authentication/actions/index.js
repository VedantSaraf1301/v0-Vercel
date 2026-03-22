"use server";

import db from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { success } from "zod";

export const onBoardUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: "No authenticated user found!!!",
      };
    }

    const { id, firstName, lastName, imageUrl, emailAddresses } = user;

    const newUser = await db.user.upsert({
      where: {
        clerkId: id,
      },
      update: {
        name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName,
        image: imageUrl || null,
        email: emailAddresses[0]?.emailAddress,
      },
      create: {
        clerkId: id,
        name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName,
        image: imageUrl || null,
        email: emailAddresses[0]?.emailAddress,
      },
    });

    return {
      success: true,
      user: newUser,
      message: "User Onboarded successfully",
    };
  } catch (error) {
    console.error("Error : ", error);
    return {
      success: false,
      error: "Failed to onBoard user",
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "No User found!!!",
      };
    }

    const currentUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        clerkId: true,
        image: true,
      },
    });

    return currentUser;
  } catch (error) {
    console.error("Error : ", error);
    return {
      success: false,
      error: "Failed to Find User",
    };
  }
};
