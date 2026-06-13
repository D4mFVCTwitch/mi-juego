$port = 8000
$root = Get-Location

Write-Host "Game Server started on http://localhost:$port"
Write-Host "Serving from: $root"
Write-Host "Press Ctrl+C to stop"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    
    $filePath = Join-Path $root $path.TrimStart("/")
    
    if (Test-Path $filePath -PathType Leaf) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Set content type
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $mimeType = "text/plain"
        
        if ($ext -eq ".html") { $mimeType = "text/html" }
        elseif ($ext -eq ".js") { $mimeType = "text/javascript" }
        elseif ($ext -eq ".css") { $mimeType = "text/css" }
        elseif ($ext -eq ".json") { $mimeType = "application/json" }
        elseif ($ext -eq ".png") { $mimeType = "image/png" }
        elseif ($ext -eq ".jpg") { $mimeType = "image/jpeg" }
        
        $response.ContentType = $mimeType
        $response.ContentEncoding = [System.Text.Encoding]::UTF8
        [byte[]]$buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
        $content = "404 Not Found"
        [byte[]]$buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.OutputStream.Close()
}

$listener.Stop()
