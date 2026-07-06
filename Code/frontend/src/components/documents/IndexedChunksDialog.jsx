import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, CircularProgress, Typography, Paper, Chip, Button } from "@mui/material";

const IndexedChunksDialog = ({ open, onClose, chunksLoading, chunksList }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Indexed Chunks</DialogTitle>

      <DialogContent dividers>
        {chunksLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : chunksList.length === 0 ? (
          <Typography>No chunks found for this document version.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {chunksList.map((chunk) => (
              <Paper
                key={chunk.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid #E5E7EB",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    Chunk #{chunk.chunk_no}
                  </Typography>

                  <Chip
                    label={chunk.has_embedding ? "Embedded" : "No Embedding"}
                    size="small"
                    color={chunk.has_embedding ? "success" : "default"}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    color: "#4B5563",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {chunk.chunk_text}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IndexedChunksDialog;
