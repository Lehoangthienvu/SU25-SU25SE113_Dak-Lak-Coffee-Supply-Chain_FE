"use client";  
import dynamic from "next/dynamic";

const PaymentNotificationPage = dynamic(
  () => import("./PaymentNotificationContent"),
  { ssr: false }
);

export default PaymentNotificationPage;
