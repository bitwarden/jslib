import { CipherType } from "../enums/cipherType";

export const ItemTypeSchemas = {
  [CipherType.WirelessNetwork]: {
    name: "WirelessNetwork",
    description: "WirelessNetworkDesc",
    properties: [
      {
        name: "Network Name/SSID",
        type: "string",
      },
      {
        name: "Wireless Security",
        type: "string",
      },
      {
        name: "Username",
        type: "string",
      },
      {
        name: "Password",
        type: "string",
      },
      {
        name: "Mode",
        type: "string",
      },
      {
        name: "Server/IP Address",
        type: "string",
      },
    ],
  },
};

/*
  Network Name/SSID: (open text)
  Wireless Security: (single-choice):
    None
    WEP
    WPA
    WPA2/WPA3
    WPA3
    WPA Enterprise
    WPA2 Enterprise
    WPA3 Enterprise
  Username (open text)
  Password (same field as password but no auto-fill)
  Mode: (single-choice):
    Automatic
    EAP-TLS
  Server/IP Address: (open text)
  Notes
*/
/*
Bank Account
  Bank Name (open text)
  Name on Account (open text)
  Type (single-select):
    Checking
    Savings
    Certificate of Deposit
    Line of Credit
    ATM
    Money Market
    Other
  Routing Number (only allow numbers)
  Account Number (only allow numbers. should be hidden by default, like a password)
  SWIFT
  IBAN
  PIN: (only allow numbers)
  Notes
*/
/*
Software License
  Version (open text)
  License Key (open text)
  Licensed to: (open text)
  Registered Email (open text)
  Company (open text)
  Username (same field as username but no auto-fill)
  Password (same field as password but no auto-fill)
  Publisher/Vendor (open text)
  Download page (open text)
  Support email
  Purchase Date (date-picker)
  Order Number
  Order Total
  Notes
*/
/*
Insurance Policy
  Company (open text)
  Policy Type (open text)
  Policy Holder (open text)
  Policy Number (open text)
  Expiration (date-picker)
  Agent Name (open text)
  Agent Phone (open text)
  URL (open text)
  Notes (same field as existing notes)
*/
