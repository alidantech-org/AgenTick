use serde_json::Value;
use std::io::{BufRead, Write};

pub struct StdioTransport<R, W> {
    reader: R,
    writer: W,
}

impl<R: BufRead, W: Write> StdioTransport<R, W> {
    pub fn new(reader: R, writer: W) -> Self {
        Self { reader, writer }
    }

    pub fn read_message(&mut self) -> std::io::Result<Option<Value>> {
        let mut content_length = None;
        loop {
            let mut line = String::new();
            if self.reader.read_line(&mut line)? == 0 {
                return Ok(None);
            }
            if line == "\r\n" || line == "\n" {
                break;
            }
            if let Some(value) = line.strip_prefix("Content-Length:") {
                content_length = value.trim().parse::<usize>().ok();
            }
        }
        let length = content_length.ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::InvalidData, "missing Content-Length")
        })?;
        let mut body = vec![0_u8; length];
        self.reader.read_exact(&mut body)?;
        serde_json::from_slice(&body)
            .map(Some)
            .map_err(std::io::Error::other)
    }

    pub fn write_message(&mut self, value: &Value) -> std::io::Result<()> {
        let bytes = serde_json::to_vec(value).map_err(std::io::Error::other)?;
        write!(self.writer, "Content-Length: {}\r\n\r\n", bytes.len())?;
        self.writer.write_all(&bytes)?;
        self.writer.flush()
    }
}
