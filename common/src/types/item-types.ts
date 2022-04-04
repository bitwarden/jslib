import { CipherType } from "../enums/cipherType";

export const ItemTypeSchemas = {
  [CipherType.WirelessNetwork]: {
    name: "WirelessNetwork",
    description: "WirelessNetworkDesc",
    properties: [
      {
        id: "ssid",
        name: "Network Name/SSID",
        type: "string",
      },
      {
        id: "wirelessSecurity",
        name: "Wireless Security",
        type: "string",
      },
      {
        id: "username",
        name: "Username",
        type: "string",
      },
      {
        id: "password",
        name: "Password",
        type: "string",
      },
      {
        id: "mode",
        name: "Mode",
        type: "string",
      },
      {
        id: "ip",
        name: "Server/IP Address",
        type: "string",
      },
    ],
  },
};

export const ItemTypeForms = {
  [CipherType.WirelessNetwork]: [
    {
      type: "section",
      title: "General",
      items: [
        {
          id: "ssid",
          type: "textfield",
        },
        {
          id: "wirelessSecurity",
          type: "dropdown",
          options: [
            "None",
            "WEP",
            "WPA",
            "WPA2/WPA3",
            "WPA3",
            "WPA Enterprise",
            "WPA2 Enterprise",
            "WPA3 Enterprise",
          ],
        },
        {
          id: "username",
          type: "textfield",
        },
        {
          id: "password",
          type: "password",
        },
        {
          id: "mode",
          type: "dropdown",
          options: ["Automatic", "EAP-TLS"],
        },
        {
          id: "ip",
          type: "textfield",
        },
      ],
    },
  ],
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
