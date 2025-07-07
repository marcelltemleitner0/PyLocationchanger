# IOS LocationChanger


---


## Requirements

- Python 3.11 or higher
- MacOS

`While it may work on Linux or Windows, additional setup is required and functionality may be limited.`
> For details and guidance, please refer to [pymobiledevice3](https://github.com/doronz88/pymobiledevice3).
---

## Setup

1. **Create and activate a virtual environment (recommended):**


```bash
python3 -m venv venv 
source venv/bin/activate
```

2. **Install requirements**


```bash
pip3 install -r requirements.txt
```



3. **Run the backend**


You need to run the backend with **sudo** because of `pymobiledevice3` 

```bash
sudo python3 main.py
```


4. **Intall frontend dependencies**
```bash
npm install
```

5. **Run the frontend**
```bash
npm run dev
```


## Additional
Run automated tests 
```bash
pytest
```
