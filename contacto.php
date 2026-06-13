<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false, 'message' => 'Método no permitido.']);
    exit;
}

session_start();
$lastSubmission = (int) ($_SESSION['contact_last_submission'] ?? 0);
if ($lastSubmission > 0 && time() - $lastSubmission < 15) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'message' => 'Espera unos segundos antes de volver a enviar.']);
    exit;
}

$input = $_POST;
if (str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    $decoded = json_decode((string) file_get_contents('php://input'), true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

// Campo invisible: los robots suelen completarlo, las personas no.
if (trim((string) ($input['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true, 'message' => 'Mensaje recibido.']);
    exit;
}

$clean = static fn (string $value): string => trim(str_replace(["\r", "\0"], '', $value));
$nombre = $clean((string) ($input['nombre'] ?? ''));
$email = filter_var($clean((string) ($input['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$telefono = $clean((string) ($input['telefono'] ?? ''));
$tipo = $clean((string) ($input['tipo'] ?? ''));
$mensaje = $clean((string) ($input['mensaje'] ?? ''));

$allowedTypes = ['Consulta de productos', 'Venta y distribución', 'Área comercial', 'Otra consulta'];
$errors = [];
if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 100) $errors[] = 'Nombre inválido.';
if ($email === false || mb_strlen((string) $email) > 160) $errors[] = 'Correo inválido.';
if ($telefono !== '' && mb_strlen($telefono) > 40) $errors[] = 'Teléfono inválido.';
if (!in_array($tipo, $allowedTypes, true)) $errors[] = 'Tipo de consulta inválido.';
if (mb_strlen($mensaje) < 10 || mb_strlen($mensaje) > 800) $errors[] = 'El mensaje debe tener entre 10 y 800 caracteres.';

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => implode(' ', $errors)], JSON_UNESCAPED_UNICODE);
    exit;
}

$recipient = getenv('GREENMEDICAL_CONTACT_TO') ?: 'comercial@greenmedical.cl';
$subject = 'Contacto web: ' . $tipo . ' - ' . $nombre;
$body = "Nuevo mensaje desde greenmedical.cl\n\n"
    . "Nombre: {$nombre}\n"
    . "Correo: {$email}\n"
    . 'Teléfono: ' . ($telefono !== '' ? $telefono : 'No informado') . "\n"
    . "Tipo: {$tipo}\n\n"
    . "Mensaje:\n{$mensaje}\n";
$headers = [
    'From: Green Medical Web <no-reply@greenmedical.cl>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];

if (!mail($recipient, $subject, $body, implode("\r\n", $headers))) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'message' => 'No pudimos enviar el mensaje. Intenta nuevamente o escríbenos a comercial@greenmedical.cl.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$_SESSION['contact_last_submission'] = time();
echo json_encode(['ok' => true, 'message' => 'Mensaje enviado. Te responderemos a la brevedad.'], JSON_UNESCAPED_UNICODE);
