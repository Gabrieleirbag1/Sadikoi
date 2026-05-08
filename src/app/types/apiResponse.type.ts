interface ApiResponse extends Response {
  success: boolean;
  message: string;
  content?: any;
}