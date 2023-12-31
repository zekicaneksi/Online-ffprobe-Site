'use client'

// MUI Imports
import { Container, Box, Typography, Paper, Button, styled, useTheme, useMediaQuery, CircularProgress, Dialog, DialogTitle, DialogContent } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ChangeEvent, useEffect, useState, DragEvent } from 'react';

export interface FfprobeDialoProps {
    open: boolean;
    onClose: () => void;
    ffprobeJson: any // It's a json
}

function FfprobeDialog(props: FfprobeDialoProps) {
    const { onClose, open, ffprobeJson } = props;

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} open={open} PaperProps={{sx: {backgroundColor: '#C3A67B'}}}>
            <DialogTitle>ffprobe results</DialogTitle>
            <DialogContent>
                <pre>{JSON.stringify(ffprobeJson, null, 2)}</pre>
            </DialogContent>
        </Dialog>
    );
}

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

let gridItemCenterCss = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}

export default () => {

    const maxFileSize = 30000000;

    const theme = useTheme()
    const smQuery = useMediaQuery(theme.breakpoints.up('sm'));

    const [file, setFile] = useState<File>()
    const [isDrag, setDrag] = useState<boolean>(false)

    const [errMessage, setErrMessage] = useState<string>("")

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogJson, setDialogJson] = useState<any>({});

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = function (e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files[0].size > maxFileSize) setDrag(false);
            setFile(e.dataTransfer.files[0])
        }
    };

    useEffect(() => {
        if (file === undefined) return
        if (file.size > maxFileSize) { setErrMessage("File size is too big"); return; }
        uploadFile()
    }, [file])

    async function uploadFile() {
        if (file === undefined || file.size > maxFileSize) return
        const formData = new FormData();

        formData.append("audioFile", file);

        try {
            // Upload the file
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (res.status === 406) {
                setErrMessage('ffprobe could not inspect the file');
                return;
            }

            const data = await res.json()
            setDialogJson(JSON.parse(data.Response))
            setDialogOpen(true);


        } catch (err) {
            setErrMessage("There is a problem with the server. Please try again later.");
        }
    }

    return (
        <>
            <FfprobeDialog
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setFile(undefined); setDialogJson({}) }}
                ffprobeJson={dialogJson}
            />
            <Box sx={{ zIndex: (isDrag ? 10 : 0), position: 'absolute', width: '100%', height: '100%', backgroundColor: (isDrag ? 'rgba(0,0,0,0.5);' : '') }} onDragEnter={() => { setDrag(true) }} onDragLeave={() => { setDrag(false) }} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault() }} />
            <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Paper elevation={2} sx={{ padding: (smQuery ? 8 : 3), backgroundColor: '#C3A67B' }}>
                    <Grid container spacing={5}>
                        <Grid xs={12} sx={gridItemCenterCss}>
                            <Typography sx={{ typography: { xs: 'body1', sm: 'h6', md: 'h5' } }}>Upload the file that you wish to see details of</Typography>
                        </Grid>
                        <Grid xs={12} sx={gridItemCenterCss}>
                            <Button component="label" variant="contained" startIcon={<UploadFileIcon />} size={(smQuery ? 'large' : 'small')}>
                                Upload Audio
                                <VisuallyHiddenInput type="file" onChange={handleFileChange} disabled={(file === undefined || file.size > maxFileSize || errMessage !== "") ? false : true} />
                            </Button>
                        </Grid>
                        {file &&
                            <Grid xs={12} sx={{ ...gridItemCenterCss }}>
                                <Grid container spacing={5} sx={{ ...gridItemCenterCss, flexDirection: 'column' }}>
                                    <Grid xs={12}>
                                        <Typography>{file.name}</Typography>
                                    </Grid>
                                    {(errMessage !== "") ?
                                        <Grid xs={12}>
                                            <Typography sx={{ typography: { xs: 'h6', sm: 'h5', md: 'h4' } }} color={theme.palette.error.main} textAlign={'center'}>{errMessage}</Typography>
                                        </Grid>
                                        : <CircularProgress />
                                    }
                                </Grid>
                            </Grid>
                        }
                        <Grid xs={12} sx={gridItemCenterCss}>
                            <Typography sx={{ typography: { xs: 'body1', sm: 'h6', md: 'h5' } }}>Max File Size: 30 MB</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </>
    )
}