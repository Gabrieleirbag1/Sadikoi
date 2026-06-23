interface Device {
  device_id: string;
  device_name: string;
  ip_address: string;
  first_seen: string | null;
  last_login: string | null;
  authorized: boolean;
}