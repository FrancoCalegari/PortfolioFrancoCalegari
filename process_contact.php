<?php
// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Collect form data
    $name = test_input($_POST["name"]);
    $email = test_input($_POST["email"]);
    $message = test_input($_POST["message"]);
    
    // Validate form data (you can add more validation)
    if (empty($name) || empty($email) || empty($message)) {
        // Handle validation errors, e.g., redirect back to the contact form with an error message
        header("Location: contact.html?error=Please fill in all fields");
        exit();
    }
    
    // Add additional validation logic as needed
    
    // Send the email (you may need to configure your mail server)
    $to = "your_email@example.com";  // Replace with your email address
    $subject = "New Contact Form Submission";
    $headers = "From: $email\r\n";
    
    // Compose the email message
    $email_message = "Name: $name\n";
    $email_message .= "Email: $email\n";
    $email_message .= "Message:\n$message\n";
    
    // Send the email
    mail($to, $subject, $email_message, $headers);
    
    // Redirect to a thank you page
    header("Location: thank_you.html");
    exit();
}

// Function to sanitize and validate form data
function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>